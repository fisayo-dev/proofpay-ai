# backend/app/api/v1/routes_webhooks.py

from fastapi import APIRouter, Header, Request

from app.core.config import settings
from app.services.webhook_service import (
    already_processed,
    mark_payment_failed,
    mark_payment_paid,
    mark_webhook_processed,
    save_webhook_event,
    verify_kora_signature,
)

router = APIRouter(prefix="/api/v1", tags=["Webhooks"])


def _extract_kora_reference(payload: dict) -> str:
    data = payload.get("data") or {}
    return data.get("payment_reference") or data.get("reference") or ""


def _is_success_event(payload: dict) -> bool:
    data = payload.get("data") or {}
    return payload.get("event") == "charge.success" or data.get("status") == "success"


def _is_failed_event(payload: dict) -> bool:
    data = payload.get("data") or {}
    return payload.get("event") == "charge.failed" or data.get("status") == "failed"


def process_kora_webhook_event(payload: dict, received_signature: str | None) -> dict:
    event_type = payload.get("event", "unknown")
    kora_reference = _extract_kora_reference(payload)
    signature_valid = verify_kora_signature(
        payload,
        received_signature,
        settings.kora_secret_key,
    )

    save_webhook_event(event_type, kora_reference, payload, signature_valid)

    if not signature_valid:
        return {
            "received": True,
            "duplicate": False,
            "signature_valid": False,
            "kora_reference": kora_reference,
        }

    if already_processed(event_type, kora_reference):
        return {
            "received": True,
            "duplicate": True,
            "signature_valid": True,
            "kora_reference": kora_reference,
        }

    if _is_success_event(payload):
        mark_payment_paid(kora_reference, payload)
    elif _is_failed_event(payload):
        mark_payment_failed(kora_reference, payload)

    mark_webhook_processed(event_type, kora_reference)

    return {
        "received": True,
        "duplicate": False,
        "signature_valid": True,
        "kora_reference": kora_reference,
    }


@router.post("/payments/kora/webhook")
async def kora_webhook_endpoint(
    request: Request,
    x_korapay_signature: str | None = Header(default=None),
):
    payload = await request.json()
    return process_kora_webhook_event(payload, x_korapay_signature)
