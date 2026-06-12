# backend/app/services/vendor_service.py

import uuid
from datetime import datetime, timezone

import psycopg

from app.db.connection import get_connection
from app.services.auth_service import hash_password, verify_password
from app.services.trust_score_service import calculate_trust_score
from app.services.vendor_reputation_service import get_vendor_badge


class VendorAlreadyExistsError(Exception):
    """Raised when signup uses an email that already belongs to a user."""


class InvalidLoginError(Exception):
    """Raised when login credentials do not match an account."""


def typical_amount_kobo_for_category(category: str | None) -> int:
    normalized = str(category or "").strip().lower()
    if normalized in {"gadgets", "electronics", "phones"}:
        return 5000000
    if normalized in {"fashion", "clothing"}:
        return 750000
    if normalized in {"food", "snacks"}:
        return 350000
    if normalized in {"software", "services", "design"}:
        return 1000000
    return 500000


def _ensure_user_auth_columns(cursor) -> None:
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT", ())


def _ensure_vendor_subscription_columns(cursor) -> None:
    cursor.execute("ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free'", ())
    cursor.execute("ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subscription_started_at TEXT", ())


def _account_from_rows(user: dict, vendor: dict | None = None) -> dict:
    return {
        "user_id": user.get("id"),
        "vendor_id": vendor.get("id") if vendor else None,
        "role": user.get("role", "buyer"),
        "full_name": user.get("full_name"),
        "email": user.get("email"),
        "business_name": vendor.get("business_name") if vendor else "",
        "trust_score": vendor.get("trust_score") if vendor else None,
        "subscription_plan": vendor.get("subscription_plan", "free") if vendor else "free",
        "created_at": user.get("created_at"),
    }


def create_vendor(data: dict) -> dict:
    vendor_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4()) if data.get("full_name") and data.get("email") else None
    now = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    try:
        user = None
        if user_id:
            _ensure_user_auth_columns(cursor)
            _ensure_vendor_subscription_columns(cursor)
            cursor.execute("""
                INSERT INTO users (id, full_name, email, role, password_hash, created_at)
                VALUES (%s, %s, %s, 'vendor', %s, %s)
                RETURNING id, full_name, email, role, created_at
            """, (
                user_id,
                data["full_name"],
                data["email"],
                hash_password(data.get("password")),
                now,
            ))
            user = dict(cursor.fetchone())

        cursor.execute("""
            INSERT INTO vendors (
                id, user_id, business_name, category, phone,
                social_handle, bank_account_name,
                trust_score, total_transactions,
                completed_transactions, dispute_count,
                created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, 50, 0, 0, 0, %s, %s)
            RETURNING *
        """, (
            vendor_id,
            user_id,
            data["business_name"],
            data["category"],
            data.get("phone"),
            data.get("social_handle"),
            data.get("bank_account_name"),
            now, now
        ))

        vendor = dict(cursor.fetchone())
        if user:
            vendor["full_name"] = user["full_name"]
            vendor["email"] = user["email"]

        conn.commit()
        return vendor
    except psycopg.errors.UniqueViolation as exc:
        if hasattr(conn, "rollback"):
            conn.rollback()
        raise VendorAlreadyExistsError("A user with this email already exists.") from exc
    finally:
        conn.close()


def create_buyer(data: dict) -> dict:
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    cursor = conn.cursor()

    try:
        _ensure_user_auth_columns(cursor)
        cursor.execute("""
            INSERT INTO users (id, full_name, email, role, password_hash, created_at)
            VALUES (%s, %s, %s, 'buyer', %s, %s)
            RETURNING id, full_name, email, role, created_at
        """, (
            user_id,
            data["full_name"],
            data["email"],
            hash_password(data.get("password")),
            now,
        ))
        user = dict(cursor.fetchone())
        conn.commit()
        return _account_from_rows(user)
    except psycopg.errors.UniqueViolation as exc:
        if hasattr(conn, "rollback"):
            conn.rollback()
        raise VendorAlreadyExistsError("A user with this email already exists.") from exc
    finally:
        conn.close()


def create_account(data: dict) -> dict:
    role = str(data.get("role") or data.get("account_type") or "vendor").lower()
    if role == "buyer":
        return create_buyer(data)

    vendor = create_vendor(data)
    return {
        "user_id": vendor.get("user_id"),
        "vendor_id": vendor.get("id"),
        "role": "vendor",
        "full_name": vendor.get("full_name"),
        "email": vendor.get("email"),
        "business_name": vendor.get("business_name"),
        "trust_score": vendor.get("trust_score"),
        "created_at": vendor.get("created_at"),
    }


def login_account(email: str, password: str | None = None) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    _ensure_user_auth_columns(cursor)
    _ensure_vendor_subscription_columns(cursor)
    cursor.execute(
        """
        SELECT
            u.id AS user_id,
            u.full_name,
            u.email,
            u.role,
            u.password_hash,
            u.created_at,
            v.id AS vendor_id,
            v.business_name,
            v.trust_score,
            v.subscription_plan
        FROM users u
        LEFT JOIN vendors v ON v.user_id = u.id
        WHERE LOWER(u.email) = LOWER(%s)
        LIMIT 1
        """,
        (email,),
    )
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(password, row.get("password_hash")):
        raise InvalidLoginError("Invalid email or password.")

    return {
        "user_id": row.get("user_id"),
        "vendor_id": row.get("vendor_id"),
        "role": row.get("role", "buyer"),
        "full_name": row.get("full_name"),
        "email": row.get("email"),
        "business_name": row.get("business_name") or "",
        "trust_score": row.get("trust_score"),
        "subscription_plan": row.get("subscription_plan", "free"),
        "created_at": row.get("created_at"),
    }


def get_vendor_by_id(vendor_id: str) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM vendors WHERE id = %s", (vendor_id,)
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_vendor_for_scoring(vendor_id: str) -> dict | None:
    """
    Returns only the fields needed for trust scoring.
    Keeps scoring logic independent from full vendor model.
    """
    vendor = get_vendor_by_id(vendor_id)
    if not vendor:
        return None

    return {
        "vendor_id": str(vendor["id"]),
        "business_name": vendor.get("business_name", ""),
        "category": vendor.get("category", ""),
        "phone": vendor.get("phone"),
        "bank_account_name": vendor.get("bank_account_name"),
        "social_handle": vendor.get("social_handle"),
        "completed_transactions": vendor.get("completed_transactions", 0),
        "total_transactions": vendor.get("total_transactions", 0),
        "dispute_count": vendor.get("dispute_count", 0),
    }


def get_vendor_score_prediction(vendor_id: str) -> dict | None:
    vendor = get_vendor_for_scoring(vendor_id)
    if not vendor:
        return None

    scoring_request = {
        "amount_kobo": typical_amount_kobo_for_category(vendor.get("category")),
    }
    current_score = calculate_trust_score(vendor, scoring_request)["score"]

    predicted_vendor = {
        **vendor,
        "completed_transactions": int(vendor.get("completed_transactions", 0) or 0) + 1,
        "total_transactions": int(vendor.get("total_transactions", 0) or 0) + 1,
    }
    predicted_score = calculate_trust_score(predicted_vendor, scoring_request)["score"]

    return {
        "current_score": current_score,
        "predicted_score_if_paid": predicted_score,
        "message": (
            "Complete this transaction to raise your trust score "
            f"from {current_score} to {predicted_score}"
        ),
    }


def get_vendor_analytics(vendor_id: str) -> dict | None:
    vendor = get_vendor_by_id(vendor_id)
    if not vendor:
        return None

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        WITH vendor_requests AS (
            SELECT *
            FROM payment_requests
            WHERE vendor_id = %s
        ),
        request_transactions AS (
            SELECT DISTINCT ON (payment_request_id)
                payment_request_id,
                payment_status,
                paid_at
            FROM transactions
            ORDER BY payment_request_id, created_at DESC
        )
        SELECT
            COUNT(vr.id) AS total_requests,
            COUNT(vr.id) FILTER (
                WHERE rt.payment_status = 'paid'
                   OR vr.status IN ('paid', 'delivered', 'disputed')
            ) AS paid_count,
            COUNT(vr.id) FILTER (
                WHERE rt.payment_status = 'failed'
                   OR vr.status = 'failed'
            ) AS failed_count,
            COUNT(vr.id) FILTER (
                WHERE COALESCE(rt.payment_status, 'pending') = 'pending'
                  AND vr.status IN ('created', 'pending')
            ) AS pending_count,
            (
                SELECT COUNT(*)
                FROM disputes d
                JOIN vendor_requests disputed_requests
                  ON disputed_requests.id = d.payment_request_id
            ) AS dispute_count,
            AVG(vr.amount_kobo) AS average_amount_kobo,
            EXTRACT(EPOCH FROM AVG(rt.paid_at - vr.created_at) FILTER (
                WHERE rt.paid_at IS NOT NULL
            )) AS average_time_to_payment_seconds
        FROM vendor_requests vr
        LEFT JOIN request_transactions rt
          ON rt.payment_request_id = vr.id
        """,
        (vendor_id,),
    )
    row = cursor.fetchone()
    conn.close()

    analytics = dict(row or {})
    total_requests = int(analytics.get("total_requests") or 0)
    paid_count = int(analytics.get("paid_count") or 0)
    average_amount_kobo = analytics.get("average_amount_kobo")
    average_time = analytics.get("average_time_to_payment_seconds")
    trust_score = int(vendor.get("trust_score") or 0)
    completed_transactions = int(vendor.get("completed_transactions") or paid_count or 0)

    return {
        "vendor_id": vendor_id,
        "trust_score": trust_score,
        "total_transactions": int(vendor.get("total_transactions") or total_requests or 0),
        "completed_transactions": completed_transactions,
        "total_requests": total_requests,
        "paid_count": paid_count,
        "failed_count": int(analytics.get("failed_count") or 0),
        "pending_count": int(analytics.get("pending_count") or 0),
        "dispute_count": int(analytics.get("dispute_count") or 0),
        "completion_rate": round(paid_count / total_requests, 4) if total_requests else 0.0,
        "average_amount_naira": (
            round(float(average_amount_kobo) / 100, 2)
            if average_amount_kobo is not None
            else 0.0
        ),
        "average_time_to_payment_seconds": (
            round(float(average_time), 2)
            if average_time is not None
            else None
        ),
        "badge": get_vendor_badge(trust_score, completed_transactions),
    }
