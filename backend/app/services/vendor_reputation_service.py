from __future__ import annotations

from datetime import datetime

from app.db.connection import get_connection


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


def _rows_to_history(rows: list[dict]) -> list[dict]:
    return [
        {
            "score": row.get("score"),
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
