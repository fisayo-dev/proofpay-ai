# backend/app/api/v1/routes_payments.py

from fastapi import APIRouter, HTTPException
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

router = APIRouter(prefix="/api/v1", tags=["Payments"])


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
