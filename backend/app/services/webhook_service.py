# backend/app/services/webhook_service.py

import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone

from app.db.connection import get_connection

logger = logging.getLogger("proofpay.webhooks")


def _canonical_json(payload_data: dict) -> str:
    return json.dumps(payload_data, separators=(",", ":"), ensure_ascii=False)


def _kora_signature_payload(payload_data: dict) -> dict:
    data = payload_data.get("data")
    return data if isinstance(data, dict) else payload_data


def verify_kora_signature(
    payload_data: dict,
    received_signature: str | None,
    secret_key: str,
) -> bool:
    message = _canonical_json(_kora_signature_payload(payload_data))
    expected = hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, received_signature or "")


def verify_kora_signature_from_body(
    raw_body: bytes,
    received_signature: str | None,
    secret_key: str,
) -> bool:
    expected = hmac.new(
        secret_key.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, received_signature or "")


def generate_kora_signature_for_test(payload_data: dict, secret_key: str) -> str:
    message = _canonical_json(_kora_signature_payload(payload_data))
    return hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def save_webhook_event(
    event_type: str,
    kora_reference: str,
    payload: dict,
    signature_valid: bool,
) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    try:
        cursor.execute(
            """
            INSERT INTO webhook_events (
                event_type, kora_reference, payload,
                signature_valid, processed, created_at
            )
            VALUES (%s, %s, %s, %s, false, %s)
            ON CONFLICT (event_type, kora_reference) DO NOTHING
            """,
            (
                event_type,
                kora_reference,
                json.dumps(payload),
                signature_valid,
                now,
            )
        )
        conn.commit()
    finally:
        conn.close()


def already_processed(event_type: str, kora_reference: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT processed FROM webhook_events
        WHERE event_type = %s AND kora_reference = %s
        """,
        (event_type, kora_reference)
    )

    row = cursor.fetchone()
    conn.close()

    if not row:
        return False
    return bool(row["processed"])


def mark_webhook_processed(event_type: str, kora_reference: str) -> None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE webhook_events
        SET processed = true, processing_note = 'processed successfully'
        WHERE event_type = %s AND kora_reference = %s
        """,
        (event_type, kora_reference)
    )

    conn.commit()
    conn.close()


def mark_payment_paid(kora_reference: str, payload: dict) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        UPDATE payment_requests
        SET status = 'paid', updated_at = %s
        WHERE kora_reference = %s AND status != 'paid'
        """,
        (now, kora_reference)
    )
    payment_requests_updated = getattr(cursor, "rowcount", "unknown")

    cursor.execute(
        """
        UPDATE transactions
        SET payment_status = 'paid',
            webhook_verified = true,
            paid_at = %s,
            updated_at = %s
        WHERE kora_reference = %s AND payment_status != 'paid'
        """,
        (now, now, kora_reference)
    )
    transactions_updated = getattr(cursor, "rowcount", "unknown")

    conn.commit()
    conn.close()
    logger.info(
        "Kora webhook paid update reference=%s payment_requests_updated=%s transactions_updated=%s",
        kora_reference or "<missing>",
        payment_requests_updated,
        transactions_updated,
    )


def mark_payment_failed(kora_reference: str, payload: dict) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        UPDATE payment_requests
        SET status = 'failed', updated_at = %s
        WHERE kora_reference = %s AND status NOT IN ('paid', 'delivered')
        """,
        (now, kora_reference)
    )
    payment_requests_updated = getattr(cursor, "rowcount", "unknown")

    cursor.execute(
        """
        UPDATE transactions
        SET payment_status = 'failed',
            webhook_verified = true,
            updated_at = %s
        WHERE kora_reference = %s
        AND payment_status NOT IN ('paid')
        """,
        (now, kora_reference)
    )
    transactions_updated = getattr(cursor, "rowcount", "unknown")

    conn.commit()
    conn.close()
    logger.info(
        "Kora webhook failed update reference=%s payment_requests_updated=%s transactions_updated=%s",
        kora_reference or "<missing>",
        payment_requests_updated,
        transactions_updated,
    )
