# backend/app/main.py

import logging
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import psycopg

from app.api.v1.routes_demo import router as demo_router
from app.api.v1.routes_disputes import router as disputes_router
from app.api.v1.routes_payment_requests import router as payment_router
from app.api.v1.routes_payments import router as payments_router
from app.api.v1.routes_uploads import router as uploads_router
from app.api.v1.routes_vendor import router as vendor_router
from app.api.v1.routes_webhooks import router as webhooks_router
from app.core.config import settings
from app.core.error_handlers import (
    database_exception_handler,
    general_exception_handler,
    validation_exception_handler,
)

logger = logging.getLogger("proofpay.requests")
UPLOAD_DIR = Path("uploads")


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

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    logger.info(
        "INCOMING %s %s client=%s",
        request.method,
        request.url.path,
        request.client.host if request.client else "<unknown>",
    )

    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "OUTGOING 500 %s %s crashed elapsed_ms=%s",
            request.method,
            request.url.path,
            elapsed_ms,
        )
        raise

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "OUTGOING %s %s %s elapsed_ms=%s",
        response.status_code,
        request.method,
        request.url.path,
        elapsed_ms,
    )
    return response


app.include_router(vendor_router)
app.include_router(payment_router)
app.include_router(payments_router)
app.include_router(uploads_router)
app.include_router(disputes_router)
app.include_router(demo_router)
app.include_router(webhooks_router)


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "ProofPay AI"}
