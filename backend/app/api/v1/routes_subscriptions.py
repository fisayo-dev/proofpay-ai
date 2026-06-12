# backend/app/api/v1/routes_subscriptions.py

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.connection import get_connection
from app.services.reference_service import generate_unique_reference
from app.services.payment_request_service import build_checkout_config, get_kora_notification_url
from app.core.config import settings
from app.services.vendor_service import get_vendor_by_id, _ensure_vendor_subscription_columns

router = APIRouter(prefix="/api/v1", tags=["Subscriptions"])


class CreateSubscriptionPaymentRequestBody(BaseModel):
    vendor_id: str
    plan: str  # "free" or "pro"
    amount_kobo: int
    currency: str = "NGN"


@router.post("/subscriptions/payment-request", status_code=201)
def create_subscription_payment_request(body: CreateSubscriptionPaymentRequestBody):
    """
    Create a subscription payment request for upgrading to Pro plan.
    Similar to payment requests but specifically for subscriptions.
    """
    # Verify vendor exists
    vendor = get_vendor_by_id(body.vendor_id)
    if not vendor:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "VENDOR_NOT_FOUND",
                "message": "Vendor not found.",
            },
        )

    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    try:
        # Ensure subscription columns exist
        _ensure_vendor_subscription_columns(cursor)

        # Generate unique reference and IDs
        kora_reference = generate_unique_reference(conn)
        payment_request_id = str(uuid.uuid4())

        # Create subscription payment request record
        cursor.execute("""
            INSERT INTO payment_requests (
                id, vendor_id, buyer_name, buyer_email,
                item_name, item_description, amount_kobo,
                currency, delivery_method, expected_delivery_date,
                status, kora_reference, public_slug,
                created_at, updated_at
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, 'created', %s, %s,
                %s, %s
            )
            RETURNING *
        """, (
            payment_request_id,
            body.vendor_id,
            vendor.get("business_name"),
            vendor.get("email") if hasattr(vendor, 'get') else None,
            f"ProofPay {body.plan.upper()} Subscription",
            "Monthly subscription upgrade",
            body.amount_kobo,
            body.currency,
            "subscription",
            None,  # expected_delivery_date
            kora_reference,
            f"sub_{body.plan}",
            now, now
        ))

        payment_request = dict(cursor.fetchone())

        # Create transaction record
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
            payment_request_id,
            kora_reference,
            body.amount_kobo,
            body.currency,
            now, now
        ))

        conn.commit()

        # Build checkout config
        checkout_config = build_checkout_config(
            settings.kora_public_key,
            get_kora_notification_url(),
            kora_reference,
            body.amount_kobo,
            body.currency,
            vendor.get("business_name") if hasattr(vendor, 'get') else vendor["business_name"],
            vendor.get("email") if hasattr(vendor, 'get') else vendor.get("email"),
        )

        return {
            "payment_request_id": payment_request_id,
            "kora_reference": kora_reference,
            "status": "created",
            "checkout_config": checkout_config
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail={
                "code": "SUBSCRIPTION_CREATION_FAILED",
                "message": "Could not create subscription payment request.",
            },
        )
    finally:
        conn.close()


def update_vendor_subscription(vendor_id: str, plan: str) -> None:
    """
    Update vendor subscription plan when payment is confirmed.
    Called from webhook handler when subscription payment is verified.
    """
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    try:
        _ensure_vendor_subscription_columns(cursor)
        cursor.execute("""
            UPDATE vendors
            SET subscription_plan = %s, subscription_started_at = %s, updated_at = %s
            WHERE id = %s
        """, (plan, now, now, vendor_id))
        conn.commit()
    finally:
        conn.close()

