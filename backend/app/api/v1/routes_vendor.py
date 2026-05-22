# backend/app/api/v1/routes_vendor.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import psycopg

from app.core.config import settings
from app.services.auth_service import create_session_token
from app.services.vendor_service import create_vendor, get_vendor_by_id

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


@router.post("/vendors", status_code=201)
def create_vendor_endpoint(body: CreateVendorRequest):
    try:
        vendor = create_vendor(body.model_dump())
        payload = {
            "vendor_id": str(vendor["id"]),
            "full_name": vendor.get("full_name"),
            "email": vendor.get("email"),
            "business_name": vendor["business_name"],
            "trust_score": float(vendor["trust_score"]) if vendor.get("trust_score") is not None else None,
            "created_at": str(vendor["created_at"]),
        }
        response = JSONResponse(status_code=201, content=payload)
        token = create_session_token(
            vendor_id=str(vendor["id"]),
            user_id=str(vendor.get("user_id")) if vendor.get("user_id") else None,
            email=vendor.get("email"),
        )
        response.set_cookie(
            key="proofpay_session",
            value=token,
            httponly=True,
            secure=settings.env == "production",
            samesite="strict",
            max_age=60 * 60 * 24,
        )
        return response
    except psycopg.OperationalError:
        raise
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
