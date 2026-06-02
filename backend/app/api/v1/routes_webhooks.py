# backend/app/api/v1/routes_webhooks.py

import json
import logging

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request

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
logger = logging.getLogger("proofpay.webhooks")


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
    logger.info(
        "Kora webhook processing started event=%s reference=%s signature_present=%s raw_body_bytes=%s",
        event_type,
        kora_reference or "<missing>",
        bool(received_signature),
        len(raw_body) if raw_body is not None else "n/a",
    )

    signature_valid = verify_kora_signature(
        payload,
        received_signature,
        settings.kora_secret_key,
    )

    logger.info(
        "Kora webhook signature checked event=%s reference=%s signature_valid=%s",
        event_type,
        kora_reference or "<missing>",
        signature_valid,
    )

    save_webhook_event(event_type, kora_reference, payload, signature_valid)
    logger.info(
        "Kora webhook event saved event=%s reference=%s signature_valid=%s",
        event_type,
        kora_reference or "<missing>",
        signature_valid,
    )

    if not signature_valid:
        logger.warning(
            "Kora webhook rejected due to invalid signature event=%s reference=%s",
            event_type,
            kora_reference or "<missing>",
        )
        return {
            "received": True,
            "duplicate": False,
            "signature_valid": False,
            "kora_reference": kora_reference,
        }

    if already_processed(event_type, kora_reference):
        logger.info(
            "Kora webhook duplicate ignored event=%s reference=%s",
            event_type,
            kora_reference or "<missing>",
        )
        return {
            "received": True,
            "duplicate": True,
            "signature_valid": True,
            "kora_reference": kora_reference,
        }

    if _is_success_event(payload):
        logger.info("Kora webhook marking payment paid reference=%s", kora_reference or "<missing>")
        mark_payment_paid(kora_reference, payload)
    elif _is_failed_event(payload):
        logger.info("Kora webhook marking payment failed reference=%s", kora_reference or "<missing>")
        mark_payment_failed(kora_reference, payload)
    else:
        logger.info(
            "Kora webhook event received with no payment state change event=%s reference=%s",
            event_type,
            kora_reference or "<missing>",
        )

    mark_webhook_processed(event_type, kora_reference)
    logger.info(
        "Kora webhook processed successfully event=%s reference=%s",
        event_type,
        kora_reference or "<missing>",
    )

    return {
        "received": True,
        "duplicate": False,
        "signature_valid": True,
        "kora_reference": kora_reference,
    }


def get_kora_webhook_probe() -> dict:
    return {
        "status": "ok",
        "service": "proofpay-kora-webhook",
    }


@router.api_route("/payments/kora/webhook", methods=["GET", "HEAD"])
@router.api_route("/payments/kora/webhook/", methods=["GET", "HEAD"])
def kora_webhook_probe_endpoint():
    return get_kora_webhook_probe()


def run_kora_webhook_processing(
    payload: dict,
    received_signature: str | None,
    raw_body: bytes,
    path: str,
    client_host: str,
) -> None:
    try:
        process_kora_webhook_event(payload, received_signature, raw_body)
    except Exception:
        logger.exception(
            "Kora webhook background processing crashed path=%s client=%s body_bytes=%s",
            path,
            client_host,
            len(raw_body),
        )


@router.post("/payments/kora/webhook")
@router.post("/payments/kora/webhook/")
async def kora_webhook_endpoint(
    background_tasks: BackgroundTasks,
    request: Request,
    x_korapay_signature: str | None = Header(default=None),
):
    raw_body = await request.body()
    client_host = request.client.host if request.client else "<unknown>"
    logger.info(
        "Kora webhook POST received path=%s client=%s content_type=%s body_bytes=%s signature_present=%s",
        request.url.path,
        client_host,
        request.headers.get("content-type", ""),
        len(raw_body),
        bool(x_korapay_signature),
    )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        logger.warning(
            "Kora webhook invalid JSON path=%s client=%s body_bytes=%s",
            request.url.path,
            client_host,
            len(raw_body),
        )
        raise HTTPException(status_code=400, detail="Invalid JSON payload.") from exc

    background_tasks.add_task(
        run_kora_webhook_processing,
        payload,
        x_korapay_signature,
        raw_body,
        request.url.path,
        client_host,
    )

    return {
        "status": "success",
        "message": "Webhook received",
    }
