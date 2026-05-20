# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes_disputes import router as disputes_router
from app.api.v1.routes_payment_requests import router as payment_router
from app.api.v1.routes_payments import router as payments_router
from app.api.v1.routes_vendor import router as vendor_router

app = FastAPI(
    title="ProofPay AI",
    description="AI-verified payment requests for student vendors",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vendor_router)
app.include_router(payment_router)
app.include_router(payments_router)
app.include_router(disputes_router)


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "ProofPay AI"}
