# backend/app/api/v1/routes_webhooks.py

import json

from fastapi import APIRouter, Header, HTTPException, Request

from app.core.config import settings
from app.services.webhook_service import (
    already_processed,
    mark_payment_failed,
    mark_payment_paid,
    mark_webhook_processed,
    save_webhook_event,
    verify_kora_signature_from_body,
    verify_kora_signature,
)
from app.api.v1.routes_ws import notify_ws

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


def process_kora_webhook_event(
    payload: dict,
    received_signature: str | None,
    raw_body: bytes | None = None,
) -> dict:
    event_type = payload.get("event", "unknown")
    kora_reference = _extract_kora_reference(payload)
    payment_request_id = None
    payment_status = None
    if raw_body is not None:
        signature_valid = verify_kora_signature_from_body(
            raw_body,
            received_signature,
            settings.kora_secret_key,
        )
    else:
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
        payment_request_id = mark_payment_paid(kora_reference, payload)
        payment_status = "paid"
    elif _is_failed_event(payload):
        mark_payment_failed(kora_reference, payload)
        payment_status = "failed"

    mark_webhook_processed(event_type, kora_reference)

    result = {
        "received": True,
        "duplicate": False,
        "signature_valid": True,
        "kora_reference": kora_reference,
    }
    if isinstance(payment_request_id, str) and payment_request_id:
        result["payment_request_id"] = payment_request_id
        result["status"] = payment_status
    return result


def get_kora_webhook_probe() -> dict:
    return {
        "status": "ok",
        "service": "proofpay-kora-webhook",
    }


@router.api_route("/payments/kora/webhook", methods=["GET", "HEAD"])
@router.api_route("/payments/kora/webhook/", methods=["GET", "HEAD"])
def kora_webhook_probe_endpoint():
    return get_kora_webhook_probe()


@router.post("/payments/kora/webhook")
@router.post("/payments/kora/webhook/")
async def kora_webhook_endpoint(
    request: Request,
    x_korapay_signature: str | None = Header(default=None),
):
    raw_body = await request.body()

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.") from exc

    result = process_kora_webhook_event(payload, x_korapay_signature, raw_body)
    if (
        result.get("signature_valid")
        and not result.get("duplicate")
        and result.get("payment_request_id")
        and result.get("status") == "paid"
    ):
        await notify_ws(result["payment_request_id"], "paid")
    return result
