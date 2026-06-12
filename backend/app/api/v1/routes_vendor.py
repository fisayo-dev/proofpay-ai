# backend/app/api/v1/routes_vendor.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import psycopg

from app.core.config import settings
from app.services.auth_service import create_session_token, public_session_payload
from app.services.ai_trust_service import generate_vendor_growth_advice
from app.services.vendor_service import (
    InvalidLoginError,
    VendorAlreadyExistsError,
    create_account,
    create_vendor,
    get_vendor_analytics,
    get_vendor_by_id,
    get_vendor_score_prediction,
    login_account,
)

router = APIRouter(prefix="/api/v1", tags=["Vendors"])


class CreateVendorRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    business_name: str
    category: str
    phone: Optional[str] = None
    social_handle: Optional[str] = None
    bank_account_name: Optional[str] = None


class SignupRequest(BaseModel):
    role: str = "vendor"
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    business_name: Optional[str] = None
    category: Optional[str] = None
    phone: Optional[str] = None
    social_handle: Optional[str] = None
    bank_account_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None


def _session_response(account: dict, status_code: int = 200) -> JSONResponse:
    payload = public_session_payload(account)
    response = JSONResponse(status_code=status_code, content=payload)
    token = create_session_token(
        vendor_id=payload.get("vendor_id"),
        user_id=payload.get("user_id"),
        email=payload.get("email"),
        role=payload.get("role", "vendor"),
    )
    response.set_cookie(
        key="proofpay_session",
        value=token,
        httponly=True,
        secure=settings.env == "production",
        samesite="none" if settings.env == "production" else "lax",
        max_age=60 * 60 * 24,
    )
    return response


@router.post("/auth/signup", status_code=201)
def signup_endpoint(body: SignupRequest):
    try:
        if body.role.lower() != "buyer":
            if not body.business_name or not body.category:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "code": "VENDOR_FIELDS_REQUIRED",
                        "message": "Vendor signup requires business_name and category.",
                    },
                )
        account = create_account(body.model_dump())
        return _session_response(account, status_code=201)
    except psycopg.OperationalError:
        raise
    except VendorAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "USER_ALREADY_EXISTS",
                "message": "A user with this email already exists. Please log in.",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/login")
def login_endpoint(body: LoginRequest):
    try:
        account = login_account(body.email, body.password)
        return _session_response(account)
    except psycopg.OperationalError:
        raise
    except InvalidLoginError:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "INVALID_LOGIN",
                "message": "Invalid email or password.",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vendors", status_code=201)
def create_vendor_endpoint(body: CreateVendorRequest):
    try:
        vendor = create_vendor(body.model_dump())
        account = {
            "user_id": vendor.get("user_id"),
            "vendor_id": vendor.get("id"),
            "role": "vendor",
            "full_name": vendor.get("full_name"),
            "email": vendor.get("email"),
            "business_name": vendor["business_name"],
            "trust_score": float(vendor["trust_score"]) if vendor.get("trust_score") is not None else None,
            "created_at": vendor.get("created_at"),
        }
        return _session_response(account, status_code=201)
    except psycopg.OperationalError:
        raise
    except VendorAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "USER_ALREADY_EXISTS",
                "message": "A user with this email already exists."
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vendors/{vendor_id}")
def get_vendor_endpoint(vendor_id: str):
    vendor = get_vendor_by_id(vendor_id)
    if not vendor:
        raise HTTPException(
            status_code=404,
            detail={"code": "VENDOR_NOT_FOUND", "message": "Vendor not found."}
        )
    return vendor


@router.get("/vendors/{vendor_id}/score-prediction")
def get_vendor_score_prediction_endpoint(vendor_id: str):
    prediction = get_vendor_score_prediction(vendor_id)
    if not prediction:
        raise HTTPException(
            status_code=404,
            detail={"code": "VENDOR_NOT_FOUND", "message": "Vendor not found."}
        )
    return prediction


@router.get("/vendors/{vendor_id}/analytics")
def get_vendor_analytics_endpoint(vendor_id: str):
    analytics = get_vendor_analytics(vendor_id)
    if not analytics:
        raise HTTPException(
            status_code=404,
            detail={"code": "VENDOR_NOT_FOUND", "message": "Vendor not found."}
        )
    return analytics


@router.get("/vendors/{vendor_id}/ai-advice")
def get_vendor_ai_advice_endpoint(vendor_id: str):
    vendor = get_vendor_by_id(vendor_id)
    analytics = get_vendor_analytics(vendor_id)
    if not vendor or not analytics:
        raise HTTPException(
            status_code=404,
            detail={"code": "VENDOR_NOT_FOUND", "message": "Vendor not found."}
        )

    return generate_vendor_growth_advice(vendor, analytics)
