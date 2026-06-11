# backend/app/api/v1/routes_payment_requests.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import psycopg

from app.services.payment_request_service import (
    amount_kobo_to_naira,
    create_payment_request,
    get_payment_request_by_id,
    get_payment_request_by_slug,
    get_trust_check_by_payment_request_id,
)
from app.services.ai_trust_service import generate_ai_trust_explanation
from app.services.trust_score_service import calculate_trust_score
from app.services.vendor_service import get_vendor_by_id, get_vendor_for_scoring
from app.services.vendor_reputation_service import (
    get_vendor_badge,
    get_vendor_trust_history,
    predict_score_after_success,
)

router = APIRouter(prefix="/api/v1", tags=["Payment Requests"])


class CreatePaymentRequestBody(BaseModel):
    vendor_id: str
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    item_name: str
    item_description: Optional[str] = None
    # Accept either `amount_kobo` (int) or `amount` (naira as float/int).
    amount_kobo: Optional[int] = None
    amount: Optional[float] = None
    currency: str = "NGN"
    delivery_method: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    image_url: Optional[str] = None


@router.post("/payment-requests", status_code=201)
def create_request_endpoint(body: CreatePaymentRequestBody):
    # Normalize amount: prefer amount_kobo if provided, otherwise convert `amount` (naira) -> kobo
    payload = body.model_dump()
    if payload.get("amount_kobo") is None:
        amt = payload.get("amount")
        if amt is None:
            raise HTTPException(
                status_code=400,
                detail={"code": "VALIDATION_ERROR", "message": "amount or amount_kobo is required."},
            )
        try:
            payload["amount_kobo"] = int(round(float(amt) * 100))
        except Exception:
            raise HTTPException(
                status_code=400,
                detail={"code": "VALIDATION_ERROR", "message": "invalid amount value."},
            )

    try:
        result = create_payment_request(payload)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail={"code": "VENDOR_NOT_FOUND", "message": str(e)}
        )
    except psycopg.OperationalError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trust/score")
def refresh_trust_score(body: dict):
    """
    Generates or refreshes a trust score for a vendor + payment context.
    Used by frontend to show live trust score before request is created.
    """
    vendor_id = body.get("vendor_id")
    if not vendor_id:
        raise HTTPException(
            status_code=400,
            detail={"code": "VALIDATION_ERROR", "message": "vendor_id is required."}
        )

    vendor = get_vendor_for_scoring(vendor_id)
    if not vendor:
        raise HTTPException(
            status_code=404,
            detail={"code": "VENDOR_NOT_FOUND", "message": "Vendor not found."}
        )

    payment_context = {
        "amount_kobo": body.get("amount_kobo", 0),
        "currency": body.get("currency", "NGN"),
        "item_name": body.get("item_name", ""),
    }

    try:
        trust = calculate_trust_score(vendor, payment_context)
    except Exception:
        trust = {
            "score": None,
            "verdict": "Manual Review Needed",
            "confidence": "low",
            "reasons": ["Trust scoring unavailable. Review vendor manually."],
            "features": {},
            "model_version": "rules-v1-anomaly",
        }

    return trust


@router.post("/trust/predict")
def predict_trust_score_endpoint(body: dict):
    vendor_id = body.get("vendor_id")
    if not vendor_id:
        raise HTTPException(
            status_code=400,
            detail={"code": "VALIDATION_ERROR", "message": "vendor_id is required."}
        )

    vendor = get_vendor_for_scoring(vendor_id)
    if not vendor:
        raise HTTPException(
            status_code=404,
            detail={"code": "VENDOR_NOT_FOUND", "message": "Vendor not found."}
        )

    score = body.get("current_score")
    if score is None:
        score = calculate_trust_score(vendor, body).get("score")

    return predict_score_after_success(score, vendor.get("completed_transactions", 0))


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
    current_vendor_score = (
        vendor.get("trust_score")
        if vendor and vendor.get("trust_score") is not None
        else request.get("trust_score_at_creation")
    )
    vendor_badge = get_vendor_badge(
        current_vendor_score,
        vendor.get("completed_transactions") if vendor else 0,
    )
    try:
        trust_history = get_vendor_trust_history(str(request["vendor_id"]), limit=8)
    except Exception:
        trust_history = []
    trust_payload = {
        "score": request.get("trust_score_at_creation"),
        "verdict": request.get("trust_verdict"),
        "reasons": trust_check.get("reasons", []) if trust_check else [],
        "features": trust_check.get("feature_snapshot", {}) if trust_check else {},
        "model_version": trust_check.get("model_version") if trust_check else None,
    }
    ai_explanation = generate_ai_trust_explanation(vendor or {}, request, trust_payload)

    return {
        "payment_request_id": str(request["id"]),
        "seller": {
            "business_name": vendor["business_name"] if vendor else "Unknown",
            "category": vendor["category"] if vendor else "",
            "social_handle": vendor.get("social_handle") if vendor else None,
            "badge": vendor_badge,
        },
        "item": {
            "name": request["item_name"],
            "description": request.get("item_description"),
            "amount": amount_kobo_to_naira(request["amount_kobo"]),
            "currency": request["currency"],
            "image_url": request.get("image_url"),
        },
        "trust": {
            "score": trust_payload["score"],
            "verdict": trust_payload["verdict"],
            "reasons": trust_payload["reasons"],
            "model_version": trust_payload["model_version"],
            "ai_summary": ai_explanation["summary"],
            "ai_recommendation": ai_explanation["recommendation"],
            "ai_powered": ai_explanation["ai_powered"],
            "ai_engine": ai_explanation["engine"],
            "ai_model": ai_explanation["model"],
            "anomaly_warnings": ai_explanation["anomaly_warnings"],
            "history": trust_history,
            "prediction": predict_score_after_success(
                current_vendor_score,
                vendor.get("completed_transactions") if vendor else 0,
            ),
        },
        "payment_status": request["status"],
        "kora_reference": request["kora_reference"],
        "public_slug": request["public_slug"]
    }
