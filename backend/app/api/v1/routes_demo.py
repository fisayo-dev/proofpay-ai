# backend/app/api/v1/routes_demo.py

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.db.connection import get_connection
from app.services.payment_request_service import create_payment_request
from app.services.trust_score_service import calculate_trust_score
from app.services.vendor_service import create_vendor

router = APIRouter(prefix="/api/v1", tags=["Demo"])

DEMO_VENDOR = {
    "vendor_id": "demo_vendor_001",
    "business_name": "Favour Fits",
    "category": "fashion",
    "phone": "+2348012345678",
    "bank_account_name": "FAVOUR ADE",
    "social_handle": "@favourfits",
    "completed_transactions": 14,
    "total_transactions": 15,
    "dispute_count": 0,
}

DEMO_REQUEST = {
    "item_name": "Black hoodie",
    "item_description": "Oversized black hoodie, size L, delivery to hall reception",
    "amount_kobo": 750000,
    "currency": "NGN",
    "buyer_name": "Daniel",
    "buyer_email": "daniel@example.com",
    "delivery_method": "CU hostel delivery",
    "expected_delivery_date": "2026-05-25",
}


@router.get("/demo/trust-score")
def demo_trust_score():
    """
    Returns a sample trust score for hackathon demo purposes.
    No database required.
    """
    trust = calculate_trust_score(DEMO_VENDOR, DEMO_REQUEST)
    return {
        "note": "This is demo data for ProofPay AI hackathon presentation.",
        "vendor": {
            "business_name": DEMO_VENDOR["business_name"],
            "category": DEMO_VENDOR["category"],
            "social_handle": DEMO_VENDOR["social_handle"],
            "completed_transactions": DEMO_VENDOR["completed_transactions"],
        },
        "payment_request": {
            "item_name": DEMO_REQUEST["item_name"],
            "amount": DEMO_REQUEST["amount_kobo"] / 100,
            "currency": DEMO_REQUEST["currency"],
            "delivery_method": DEMO_REQUEST["delivery_method"],
        },
        "trust": trust,
    }


@router.get("/demo/scenarios")
def demo_scenarios():
    """
    Returns trust scores for 3 different vendor scenarios.
    Useful for showing the AI scoring range during demo.
    """
    scenarios = [
        {
            "label": "Trusted Vendor",
            "vendor": DEMO_VENDOR,
            "request": DEMO_REQUEST,
        },
        {
            "label": "Caution Vendor",
            "vendor": {
                "business_name": "Quick Deals",
                "category": "gadgets",
                "phone": "+2348099999999",
                "bank_account_name": "QUICK ADE",
                "social_handle": None,
                "completed_transactions": 5,
                "total_transactions": 8,
                "dispute_count": 1,
            },
            "request": {"amount_kobo": 8000000, "currency": "NGN"},
        },
        {
            "label": "High Risk Vendor",
            "vendor": {
                "business_name": "New Store",
                "category": "other",
                "phone": None,
                "bank_account_name": None,
                "social_handle": None,
                "completed_transactions": 0,
                "total_transactions": 0,
                "dispute_count": 0,
            },
            "request": {"amount_kobo": 25000000, "currency": "NGN"},
        },
    ]

    results = []
    for scenario in scenarios:
        trust = calculate_trust_score(scenario["vendor"], scenario["request"])
        results.append({
            "label": scenario["label"],
            "score": trust["score"],
            "verdict": trust["verdict"],
            "confidence": trust["confidence"],
            "reasons": trust["reasons"],
        })

    return {
        "note": "Three scoring scenarios for ProofPay AI demo.",
        "scenarios": results,
    }


@router.post("/demo/seed")
def seed_demo_data():
    """
    Creates a fresh demo vendor and payment request.
    Use this to reset demo data before presentation.
    """
    try:
        vendor = create_vendor({
            "business_name": "Favour Fits",
            "category": "fashion",
            "phone": "+2348012345678",
            "social_handle": "@favourfits",
            "bank_account_name": "FAVOUR ADE",
        })
        vendor_id = str(vendor["id"])

        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            """
            UPDATE vendors
            SET completed_transactions = 14,
                total_transactions = 15,
                dispute_count = 0,
                updated_at = %s
            WHERE id = %s
            """,
            (now, vendor_id),
        )
        conn.commit()
        conn.close()

        result = create_payment_request({
            "vendor_id": vendor_id,
            "buyer_name": "Daniel",
            "buyer_email": "daniel@example.com",
            "item_name": "Black hoodie",
            "item_description": "Oversized black hoodie, size L",
            "amount_kobo": 750000,
            "currency": "NGN",
            "delivery_method": "CU hostel delivery",
            "expected_delivery_date": "2026-05-25",
        })

        return {
            "message": "Demo data seeded successfully.",
            "vendor_id": vendor_id,
            "payment_request_id": result["payment_request_id"],
            "public_slug": result["public_slug"],
            "public_url": result["public_url"],
            "kora_reference": result["kora_reference"],
            "trust": result["trust"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "SEED_FAILED", "message": str(e)},
        )
