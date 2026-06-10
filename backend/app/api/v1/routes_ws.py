# backend/app/api/v1/routes_ws.py

from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

active_connections: Dict[str, WebSocket] = {}


@router.websocket("/ws/payments/{payment_request_id}/status")
async def payment_status_ws(websocket: WebSocket, payment_request_id: str):
    await websocket.accept()
    active_connections[payment_request_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.pop(payment_request_id, None)


async def notify_ws(payment_request_id: str, status: str):
    websocket = active_connections.get(payment_request_id)
    if websocket:
        await websocket.send_json({"status": status})
