# backend/app/api/v1/routes_vendor.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import psycopg

from app.services.vendor_service import create_vendor, get_vendor_by_id

router = APIRouter(prefix="/api/v1", tags=["Vendors"])


class CreateVendorRequest(BaseModel):
    business_name: str
    category: str
    phone: Optional[str] = None
    social_handle: Optional[str] = None
    bank_account_name: Optional[str] = None


@router.post("/vendors", status_code=201)
def create_vendor_endpoint(body: CreateVendorRequest):
    try:
        vendor = create_vendor(body.model_dump())
        return {
            "vendor_id": str(vendor["id"]),
            "business_name": vendor["business_name"],
            "trust_score": vendor["trust_score"],
            "created_at": str(vendor["created_at"])
        }
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
