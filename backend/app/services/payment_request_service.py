# backend/app/services/payment_request_service.py

import uuid
import json
from datetime import datetime, timezone
from app.db.connection import get_connection
from app.services.reference_service import (
    generate_unique_reference,
    generate_unique_slug
)
from app.services.trust_score_service import calculate_trust_score
from app.services.vendor_service import get_vendor_for_scoring
from app.core.config import settings


def amount_kobo_to_naira(amount_kobo: int) -> float:
    return round(amount_kobo / 100, 2)


def build_public_url(frontend_base_url: str, public_slug: str) -> str:
    return f"{frontend_base_url.rstrip('/')}/r/{public_slug}"


def get_kora_notification_url() -> str:
    configured_url = settings.kora_webhook_url.strip()
    if configured_url:
        return configured_url

    return f"{settings.backend_base_url.rstrip('/')}/api/v1/payments/kora/webhook"


def build_checkout_config(
    kora_public_key: str,
    kora_webhook_url: str,
    kora_reference: str,
    amount_kobo: int,
    currency: str,
    buyer_name: str | None,
    buyer_email: str | None,
) -> dict:
    return {
        "key": kora_public_key,
        "reference": kora_reference,
        "amount": amount_kobo_to_naira(amount_kobo),
        "currency": currency,
        "customer": {
            "name": buyer_name or "",
            "email": buyer_email or "",
        },
        "notification_url": kora_webhook_url,
    }


def create_payment_request(data: dict) -> dict:
    vendor_id = data["vendor_id"]
    amount_kobo = data["amount_kobo"]

    # Step 1: Fetch vendor for scoring
    vendor = get_vendor_for_scoring(vendor_id)
    if not vendor:
        raise ValueError("Vendor not found")

    # Step 2: Generate unique reference and slug
    conn = get_connection()
    kora_reference = generate_unique_reference(conn)
    public_slug = generate_unique_slug(conn)

    # Step 3: Run trust scoring
    try:
        trust_result = calculate_trust_score(vendor, data)
    except Exception as e:
        trust_result = {
            "score": None,
            "verdict": "Manual Review Needed",
            "confidence": "low",
            "reasons": ["Trust scoring unavailable. Review vendor manually."],
            "features": {},
            "model_version": "rules-v1"
        }

    # Step 4: Build public URL
    public_url = build_public_url(settings.frontend_base_url, public_slug)

    # Step 5: Insert payment request
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO payment_requests (
            id, vendor_id, buyer_name, buyer_email,
            item_name, item_description, amount_kobo,
            currency, delivery_method, expected_delivery_date,
            status, kora_reference, public_slug,
            trust_score_at_creation, trust_verdict,
            created_at, updated_at
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, 'created', %s, %s,
            %s, %s, %s, %s
        )
        RETURNING *
    """, (
        request_id,
        vendor_id,
        data.get("buyer_name"),
        data.get("buyer_email"),
        data["item_name"],
        data.get("item_description"),
        amount_kobo,
        data.get("currency", "NGN"),
        data.get("delivery_method"),
        data.get("expected_delivery_date"),
        kora_reference,
        public_slug,
        trust_result.get("score"),
        trust_result.get("verdict"),
        now, now
    ))

    payment_request = dict(cursor.fetchone())

    # Step 6: Save trust check snapshot
    trust_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO trust_checks (
            id, payment_request_id, vendor_id,
            score, verdict, reasons,
            feature_snapshot, model_version, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        trust_id,
        request_id,
        vendor_id,
        trust_result.get("score"),
        trust_result.get("verdict"),
        json.dumps(trust_result.get("reasons", [])),
        json.dumps(trust_result.get("features", {})),
        trust_result.get("model_version", "rules-v1"),
        now
    ))

    # Step 7: Create initial transaction row
    transaction_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO transactions (
            id, payment_request_id, kora_reference,
            amount_kobo, currency, payment_status,
            webhook_verified, created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, 'pending', false, %s, %s)
    """, (
        transaction_id,
        request_id,
        kora_reference,
        amount_kobo,
        data.get("currency", "NGN"),
        now, now
    ))

    conn.commit()
    conn.close()

    # Step 8: Build checkout config for Fisayo
    checkout_config = build_checkout_config(
        settings.kora_public_key,
        get_kora_notification_url(),
        kora_reference,
        amount_kobo,
        data.get("currency", "NGN"),
        data.get("buyer_name"),
        data.get("buyer_email"),
    )

    return {
        "payment_request_id": request_id,
        "public_slug": public_slug,
        "public_url": public_url,
        "kora_reference": kora_reference,
        "status": "created",
        "trust": trust_result,
        "checkout_config": checkout_config
    }


def get_payment_request_by_id(request_id: str) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM payment_requests WHERE id = %s",
        (request_id,)
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_payment_request_by_slug(slug: str) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM payment_requests WHERE public_slug = %s",
        (slug,)
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_trust_check_by_payment_request_id(payment_request_id: str) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT score, verdict, reasons, feature_snapshot, model_version, created_at
        FROM trust_checks
        WHERE payment_request_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (payment_request_id,)
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None
