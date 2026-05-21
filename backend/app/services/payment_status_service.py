# backend/app/services/payment_status_service.py

from app.db.connection import get_connection
from app.services.payment_request_service import amount_kobo_to_naira


def get_payment_status(payment_request_id: str) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM payment_requests WHERE id = %s",
        (payment_request_id,)
    )
    request = cursor.fetchone()

    if not request:
        conn.close()
        return None

    request = dict(request)

    cursor.execute(
        """
        SELECT * FROM transactions
        WHERE payment_request_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (payment_request_id,)
    )
    transaction = cursor.fetchone()
    conn.close()

    result = {
        "payment_request_id": str(request["id"]),
        "kora_reference": request["kora_reference"],
        "status": request["status"],
        "amount": amount_kobo_to_naira(request["amount_kobo"]),
        "currency": request["currency"],
        "item_name": request["item_name"],
        "buyer_name": request.get("buyer_name"),
        "created_at": str(request["created_at"]),
    }

    if transaction:
        transaction = dict(transaction)
        result["transaction"] = {
            "payment_status": transaction["payment_status"],
            "webhook_verified": transaction["webhook_verified"],
            "paid_at": str(transaction["paid_at"]) if transaction.get("paid_at") else None,
            "payment_method": transaction.get("payment_method"),
        }
    else:
        result["transaction"] = None

    return result


def get_vendor_payment_requests(vendor_id: str) -> list:
    """
    Returns all payment requests for a vendor.
    Used for seller dashboard.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            pr.id,
            pr.item_name,
            pr.amount_kobo,
            pr.currency,
            pr.status,
            pr.buyer_name,
            pr.public_slug,
            pr.trust_score_at_creation,
            pr.trust_verdict,
            pr.created_at,
            t.payment_status,
            t.paid_at
        FROM payment_requests pr
        LEFT JOIN transactions t
            ON t.payment_request_id = pr.id
        WHERE pr.vendor_id = %s
        ORDER BY pr.created_at DESC
        """,
        (vendor_id,)
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": str(row["id"]),
            "item_name": row["item_name"],
            "amount": amount_kobo_to_naira(row["amount_kobo"]),
            "currency": row["currency"],
            "status": row["status"],
            "buyer_name": row.get("buyer_name"),
            "public_slug": row["public_slug"],
            "trust_score": row.get("trust_score_at_creation"),
            "trust_verdict": row.get("trust_verdict"),
            "payment_status": row.get("payment_status"),
            "paid_at": str(row["paid_at"]) if row.get("paid_at") else None,
            "created_at": str(row["created_at"]),
        }
        for row in rows
    ]
