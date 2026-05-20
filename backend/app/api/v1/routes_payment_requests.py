# backend/app/api/v1/routes_payment_requests.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.payment_request_service import (
    amount_kobo_to_naira,
    create_payment_request,
    get_payment_request_by_id,
    get_payment_request_by_slug,
    get_trust_check_by_payment_request_id,
)
from app.services.vendor_service import get_vendor_by_id

router = APIRouter(prefix="/api/v1", tags=["Payment Requests"])


class CreatePaymentRequestBody(BaseModel):
    vendor_id: str
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    item_name: str
    item_description: Optional[str] = None
    amount_kobo: int
    currency: str = "NGN"
    delivery_method: Optional[str] = None
    expected_delivery_date: Optional[str] = None


@router.post("/payment-requests", status_code=201)
def create_request_endpoint(body: CreatePaymentRequestBody):
    try:
        result = create_payment_request(body.model_dump())
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail={"code": "VENDOR_NOT_FOUND", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payment-requests/{request_id}")
def get_request_endpoint(request_id: str):
    request = get_payment_request_by_id(request_id)
    if not request:
        raise HTTPException(
            status_code=404,
            detail={"code": "PAYMENT_REQUEST_NOT_FOUND",
                    "message": "Payment request not found."}
        )
    return request


@router.get("/public/r/{public_slug}")
def get_public_request_endpoint(public_slug: str):
    request = get_payment_request_by_slug(public_slug)
    if not request:
        raise HTTPException(
            status_code=404,
            detail={"code": "PAYMENT_REQUEST_NOT_FOUND",
                    "message": "This payment request does not exist or has expired."}
        )

    vendor = get_vendor_by_id(str(request["vendor_id"]))
    trust_check = get_trust_check_by_payment_request_id(str(request["id"]))

    return {
        "payment_request_id": str(request["id"]),
        "seller": {
            "business_name": vendor["business_name"] if vendor else "Unknown",
            "category": vendor["category"] if vendor else "",
            "social_handle": vendor.get("social_handle") if vendor else None
        },
        "item": {
            "name": request["item_name"],
            "description": request.get("item_description"),
            "amount": amount_kobo_to_naira(request["amount_kobo"]),
            "currency": request["currency"]
        },
        "trust": {
            "score": request.get("trust_score_at_creation"),
            "verdict": request.get("trust_verdict"),
            "reasons": trust_check.get("reasons", []) if trust_check else [],
            "model_version": trust_check.get("model_version") if trust_check else None,
        },
        "payment_status": request["status"],
        "kora_reference": request["kora_reference"],
        "public_slug": request["public_slug"]
    }
