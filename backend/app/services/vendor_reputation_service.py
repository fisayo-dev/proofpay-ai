from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from app.db.connection import get_connection
from app.services.trust_score_service import calculate_trust_score


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def get_vendor_badge(score: int | float | None, completed_transactions: int | None = 0) -> dict:
    score_value = int(score or 0)
    completed = int(completed_transactions or 0)

    if score_value >= 85 and completed >= 20:
        return {
            "key": "top_seller",
            "label": "Top Seller",
            "icon": "🏆",
            "description": "High trust score with strong completed transaction history.",
        }
    if score_value >= 75 and completed >= 5:
        return {
            "key": "verified",
            "label": "Verified",
            "icon": "✅",
            "description": "Strong trust profile and enough completed transactions.",
        }
    if score_value >= 60 or completed >= 3:
        return {
            "key": "rising_star",
            "label": "Rising Star",
            "icon": "⭐",
            "description": "Promising vendor with growing ProofPay activity.",
        }

    return {
        "key": "new_vendor",
        "label": "New Vendor",
        "icon": "🧾",
        "description": "Limited transaction history. Review the trust signals before paying.",
    }


def predict_score_after_success(current_score: int | float | None, completed_transactions: int | None = 0) -> dict:
    score = int(current_score or 0)
    completed = int(completed_transactions or 0)
    lift = 2

    if completed < 3:
        lift = 6
    elif completed < 10:
        lift = 4
    elif score >= 90:
        lift = 1

    predicted = min(100, score + lift)
    return {
        "current_score": score,
        "predicted_score": predicted,
        "delta": predicted - score,
        "message": f"If this transaction completes successfully, the vendor trust score could rise from {score} to {predicted}.",
    }


def update_vendor_reputation_after_paid(cursor, payment_request_id: str) -> dict | None:
    """
    Feed a successful payment back into the vendor profile.

    This is what makes the product feel alive: after payment success, the
    vendor's completed transaction count and current trust score move forward,
    and a fresh trust check is saved for the reputation graph.
    """
    cursor.execute(
        """
        SELECT
            pr.id AS payment_request_id,
            pr.vendor_id,
            pr.item_name,
            pr.item_description,
            pr.amount_kobo,
            pr.currency,
            pr.delivery_method,
            v.business_name,
            v.category,
            v.phone,
            v.bank_account_name,
            v.social_handle,
            v.completed_transactions,
            v.total_transactions,
            v.dispute_count
        FROM payment_requests pr
        JOIN vendors v ON v.id = pr.vendor_id
        WHERE pr.id = %s
        LIMIT 1
        """,
        (payment_request_id,),
    )
    row = cursor.fetchone()
    if not row:
        return None

    row = dict(row)
    now = datetime.now(timezone.utc).isoformat()
    completed_transactions = _safe_int(row.get("completed_transactions")) + 1
    total_transactions = max(
        _safe_int(row.get("total_transactions")) + 1,
        completed_transactions,
    )

    scoring_vendor = {
        "vendor_id": str(row["vendor_id"]),
        "business_name": row.get("business_name"),
        "category": row.get("category"),
        "phone": row.get("phone"),
        "bank_account_name": row.get("bank_account_name"),
        "social_handle": row.get("social_handle"),
        "completed_transactions": completed_transactions,
        "total_transactions": total_transactions,
        "dispute_count": row.get("dispute_count") or 0,
    }
    scoring_request = {
        "item_name": row.get("item_name"),
        "item_description": row.get("item_description"),
        "amount_kobo": row.get("amount_kobo") or 0,
        "currency": row.get("currency") or "NGN",
        "delivery_method": row.get("delivery_method"),
    }
    trust = calculate_trust_score(scoring_vendor, scoring_request)

    cursor.execute(
        """
        UPDATE vendors
        SET completed_transactions = %s,
            total_transactions = %s,
            trust_score = %s,
            updated_at = %s
        WHERE id = %s
        """,
        (
            completed_transactions,
            total_transactions,
            trust.get("score"),
            now,
            row["vendor_id"],
        ),
    )

    cursor.execute(
        """
        INSERT INTO trust_checks (
            id, payment_request_id, vendor_id,
            score, verdict, reasons,
            feature_snapshot, model_version, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            str(uuid.uuid4()),
            payment_request_id,
            row["vendor_id"],
            trust.get("score"),
            trust.get("verdict"),
            json.dumps(trust.get("reasons", [])),
            json.dumps(trust.get("features", {})),
            "post-payment-reputation-v1",
            now,
        ),
    )
    return trust


def _rows_to_history(rows: list[dict]) -> list[dict]:
    return [
        {
            "score": int(row.get("score") or 0),
            "verdict": row.get("verdict"),
            "created_at": str(row.get("created_at")),
            "payment_request_id": str(row.get("payment_request_id")) if row.get("payment_request_id") else None,
        }
        for row in rows
    ]


def get_vendor_trust_history(vendor_id: str, limit: int = 12) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT payment_request_id, score, verdict, created_at
        FROM trust_checks
        WHERE vendor_id = %s
        ORDER BY created_at DESC
        LIMIT %s
        """,
        (vendor_id, limit),
    )
    rows = cursor.fetchall()
    conn.close()
    return list(reversed(_rows_to_history([dict(row) for row in rows])))


def get_vendor_metrics(vendor_id: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            COUNT(pr.id) AS total_requests,
            COALESCE(SUM(CASE WHEN t.payment_status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_requests,
            COALESCE(AVG(EXTRACT(EPOCH FROM (t.paid_at - pr.created_at))), 0) AS avg_payment_seconds
        FROM payment_requests pr
        LEFT JOIN transactions t ON t.payment_request_id = pr.id
        WHERE pr.vendor_id = %s
        """,
        (vendor_id,),
    )
    row = dict(cursor.fetchone() or {})
    cursor.execute(
        "SELECT dispute_count, total_transactions, completed_transactions, trust_score FROM vendors WHERE id = %s",
        (vendor_id,),
    )
    vendor = dict(cursor.fetchone() or {})
    conn.close()

    total_requests = int(row.get("total_requests") or 0)
    paid_requests = int(row.get("paid_requests") or 0)
    total_transactions = int(vendor.get("total_transactions") or total_requests or 0)
    disputes = int(vendor.get("dispute_count") or 0)
    completed = int(vendor.get("completed_transactions") or paid_requests or 0)
    trust_score = vendor.get("trust_score") or 0

    return {
        "vendor_id": vendor_id,
        "total_requests": total_requests,
        "paid_requests": paid_requests,
        "completion_rate": round(paid_requests / total_requests, 3) if total_requests else 0,
        "dispute_rate": round(disputes / total_transactions, 3) if total_transactions else 0,
        "average_payment_seconds": round(float(row.get("avg_payment_seconds") or 0), 2),
        "completed_transactions": completed,
        "trust_score": trust_score,
        "badge": get_vendor_badge(trust_score, completed),
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
