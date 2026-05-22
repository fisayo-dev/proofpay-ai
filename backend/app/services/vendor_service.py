# backend/app/services/vendor_service.py

import uuid
from datetime import datetime, timezone
from app.db.connection import get_connection


def create_vendor(data: dict) -> dict:
    vendor_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4()) if data.get("full_name") and data.get("email") else None
    now = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    user = None
    if user_id:
        cursor.execute("""
            INSERT INTO users (id, full_name, email, role, created_at)
            VALUES (%s, %s, %s, 'vendor', %s)
            RETURNING id, full_name, email
        """, (
            user_id,
            data["full_name"],
            data["email"],
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
    conn.close()
    return vendor


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
