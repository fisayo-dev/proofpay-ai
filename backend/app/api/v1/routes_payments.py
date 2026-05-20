# backend/app/api/v1/routes_payments.py

from fastapi import APIRouter, HTTPException
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
