# backend/app/api/v1/routes_disputes.py

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.connection import get_connection

router = APIRouter(prefix="/api/v1", tags=["Disputes & Delivery"])


class ConfirmDeliveryBody(BaseModel):
    payment_request_id: str


class CreateDisputeBody(BaseModel):
    payment_request_id: str
    reason: str


@router.post("/delivery/confirm")
def confirm_delivery(body: ConfirmDeliveryBody):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        UPDATE payment_requests
        SET status = 'delivered', updated_at = %s
        WHERE id = %s AND status = 'paid'
        RETURNING id
        """,
        (now, body.payment_request_id)
    )

    updated = cursor.fetchone()
    conn.commit()
    conn.close()

    if not updated:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_STATE",
                "message": "Delivery can only be confirmed after payment is verified.",
            },
        )

    return {"status": "delivered", "payment_request_id": body.payment_request_id}


@router.post("/disputes")
def create_dispute(body: CreateDisputeBody):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        "SELECT id, status FROM payment_requests WHERE id = %s",
        (body.payment_request_id,)
    )
    request = cursor.fetchone()

    if not request:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAYMENT_REQUEST_NOT_FOUND",
                "message": "Payment request not found.",
            },
        )

    if dict(request)["status"] not in ("paid", "delivered"):
        conn.close()
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_STATE",
                "message": "Disputes can only be raised after payment.",
            },
        )

    dispute_id = str(uuid.uuid4())
    cursor.execute(
        """
        INSERT INTO disputes (id, payment_request_id, reason, status, created_at)
        VALUES (%s, %s, %s, 'open', %s)
        RETURNING id
        """,
        (dispute_id, body.payment_request_id, body.reason, now)
    )

    cursor.execute(
        """
        UPDATE payment_requests
        SET status = 'disputed', updated_at = %s
        WHERE id = %s
        """,
        (now, body.payment_request_id)
    )

    conn.commit()
    conn.close()

    return {
        "status": "disputed",
        "dispute_id": dispute_id,
        "payment_request_id": body.payment_request_id,
    }
