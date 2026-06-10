# backend/app/main.py

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
import psycopg

from app.api.v1.routes_demo import router as demo_router
from app.api.v1.routes_disputes import router as disputes_router
from app.api.v1.routes_payment_requests import router as payment_router
from app.api.v1.routes_payments import router as payments_router
from app.api.v1.routes_vendor import router as vendor_router
from app.api.v1.routes_webhooks import router as webhooks_router
from app.api.v1.routes_ws import router as ws_router
from app.core.config import settings
from app.core.error_handlers import (
    database_exception_handler,
    general_exception_handler,
    validation_exception_handler,
)


def get_allowed_origins() -> list[str]:
    origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.frontend_base_url.rstrip("/"),
    }
    return sorted(origin for origin in origins if origin)

app = FastAPI(
    title="ProofPay AI",
    description="AI-verified payment requests for student vendors",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(psycopg.OperationalError, database_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(vendor_router)
app.include_router(payment_router)
app.include_router(payments_router)
app.include_router(disputes_router)
app.include_router(demo_router)
app.include_router(webhooks_router)
app.include_router(ws_router)


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "ProofPay AI"}
