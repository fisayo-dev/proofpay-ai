# backend/app/api/v1/routes_payments.py

import logging
import json
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.core.config import settings
from app.services.payment_request_service import (
    build_checkout_config,
    get_kora_notification_url,
    get_payment_request_by_id,
)
from app.services.payment_status_service import (
    get_payment_status,
    get_vendor_payment_requests,
)
from app.services.kora_service import KoraVerificationError, verify_kora_charge
from app.services.webhook_service import mark_payment_paid_from_checkout_callback
from app.services.receipt_service import generate_receipt_pdf
from app.api.v1.routes_webhooks import (
    get_kora_webhook_probe,
    process_kora_webhook_event,
)
from app.api.v1.routes_ws import notify_ws

router = APIRouter(prefix="/api/v1", tags=["Payments"])
logger = logging.getLogger("proofpay.payments")

NON_PRODUCTION_ENVS = {"development", "dev", "test", "testing", "demo"}


class VerifyKoraCheckoutBody(BaseModel):
    kora_reference: str | None = None


def _amount_kobo_matches(kora_amount: float, amount_kobo: int) -> bool:
    return round(kora_amount * 100) == int(amount_kobo)


def _reconcile_payment_request(
    request: dict,
    source: str,
    fallback_source: str | None = None,
) -> dict:
    kora_reference = request["kora_reference"]

    try:
        charge = verify_kora_charge(kora_reference)
    except KoraVerificationError as exc:
        logger.warning(
            "Kora payment reconciliation unavailable reference=%s env=%s source=%s error=%s",
            kora_reference,
            settings.env,
            source,
            str(exc),
        )
        if settings.env.lower() in NON_PRODUCTION_ENVS:
            mark_payment_paid_from_checkout_callback(kora_reference)
            return {
                "payment_request_id": str(request["id"]),
                "kora_reference": kora_reference,
                "status": "paid",
                "source": fallback_source or f"{source}_fallback",
                "warning": "Kora server-side verification was unavailable, so test-mode reconciliation fallback was used.",
            }

        raise HTTPException(
            status_code=503,
            detail={
                "code": "KORA_VERIFICATION_UNAVAILABLE",
                "message": "Could not verify this payment with Kora yet.",
            },
        ) from exc

    if charge["status"] != "success":
        raise HTTPException(
            status_code=409,
            detail={
                "code": "KORA_CHARGE_NOT_SUCCESSFUL",
                "message": "Kora has not confirmed this payment as successful.",
            },
        )

    if (
        charge["reference"] != kora_reference
        or charge["currency"] != request.get("currency", "NGN")
        or not _amount_kobo_matches(charge["amount"], request["amount_kobo"])
    ):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "KORA_CHARGE_MISMATCH",
                "message": "Kora charge details do not match this payment request.",
            },
        )

    mark_payment_paid_from_checkout_callback(kora_reference)

    return {
        "payment_request_id": str(request["id"]),
        "kora_reference": kora_reference,
        "status": "paid",
        "source": source,
    }


@router.get("/payments/{payment_request_id}/status")
def get_payment_status_endpoint(payment_request_id: str):
    result = get_payment_status(payment_request_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAYMENT_REQUEST_NOT_FOUND",
                "message": "Payment request not found.",
            },
        )
    return result


@router.get("/payments/kora/config/{payment_request_id}")
def get_kora_checkout_config_endpoint(payment_request_id: str):
    request = get_payment_request_by_id(payment_request_id)
    if not request:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAYMENT_REQUEST_NOT_FOUND",
                "message": "Payment request not found.",
            },
        )

    checkout_config = build_checkout_config(
        settings.kora_public_key,
        get_kora_notification_url(),
        request["kora_reference"],
        request["amount_kobo"],
        request.get("currency", "NGN"),
        request.get("buyer_name"),
        request.get("buyer_email"),
    )

    return {
        "payment_request_id": str(request["id"]),
        "kora_reference": request["kora_reference"],
        "checkout_config": checkout_config,
    }


@router.post("/payments/{payment_request_id}/verify-checkout")
def verify_kora_checkout_endpoint(
    payment_request_id: str,
    body: VerifyKoraCheckoutBody,
):
    request = get_payment_request_by_id(payment_request_id)
    if not request:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAYMENT_REQUEST_NOT_FOUND",
                "message": "Payment request not found.",
            },
        )

    kora_reference = request["kora_reference"]
    if body.kora_reference and body.kora_reference != kora_reference:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "KORA_REFERENCE_MISMATCH",
                "message": "Kora reference does not match this payment request.",
            },
        )

    mark_payment_paid_from_checkout_callback(kora_reference)

    return {
        "payment_request_id": str(request["id"]),
        "kora_reference": kora_reference,
        "status": "paid",
        "source": "kora_checkout_callback",
    }


@router.post("/payments/{payment_request_id}/reconcile")
def reconcile_payment_endpoint(payment_request_id: str):
    request = get_payment_request_by_id(payment_request_id)
    if not request:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAYMENT_REQUEST_NOT_FOUND",
                "message": "Payment request not found.",
            },
        )

    return _reconcile_payment_request(request, "kora_reconcile")


@router.get("/vendors/{vendor_id}/requests")
def get_vendor_requests_endpoint(vendor_id: str):
    """
    Seller dashboard - returns all payment requests for a vendor.
    """
    requests = get_vendor_payment_requests(vendor_id)
    return {
        "vendor_id": vendor_id,
        "total": len(requests),
        "requests": requests,
    }


@router.get("/payments/{payment_request_id}/receipt")
def get_payment_receipt_endpoint(payment_request_id: str):
    """
    Download PDF receipt for a paid payment request.
    """
    request = get_payment_request_by_id(payment_request_id)
    if not request:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAYMENT_REQUEST_NOT_FOUND",
                "message": "Payment request not found.",
            },
        )

    if request["status"] != "paid":
        raise HTTPException(
            status_code=409,
            detail={
                "code": "PAYMENT_NOT_PAID",
                "message": "Receipt is only available for paid payments.",
            },
        )

    receipt_path = Path("/tmp") / f"{request['kora_reference']}_receipt.pdf"
    if not receipt_path.exists():
        raise HTTPException(
            status_code=404,
            detail={
                "code": "RECEIPT_NOT_FOUND",
                "message": "Receipt not yet generated. Please try again in a moment.",
            },
        )

    return FileResponse(
        str(receipt_path),
        media_type="application/pdf",
        filename=f"receipt_{request['kora_reference']}.pdf",
    )


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
