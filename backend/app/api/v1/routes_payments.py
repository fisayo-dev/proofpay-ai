# backend/app/api/v1/routes_payments.py

from fastapi import APIRouter, HTTPException
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

router = APIRouter(prefix="/api/v1", tags=["Payments"])


class VerifyKoraCheckoutBody(BaseModel):
    kora_reference: str | None = None


def _amount_kobo_matches(kora_amount: float, amount_kobo: int) -> bool:
    return round(kora_amount * 100) == int(amount_kobo)


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

    try:
        charge = verify_kora_charge(kora_reference)
    except KoraVerificationError as exc:
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
        "source": "kora_charge_verify",
    }


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
