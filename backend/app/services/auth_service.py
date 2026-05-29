# backend/app/services/auth_service.py

import base64
import hashlib
import hmac
import json
import time

from app.core.config import settings


def _base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _session_secret() -> str:
    return (
        settings.session_secret
        or settings.supabase_service_role_key
        or "dev-proofpay-session-secret"
    )


def create_session_token(vendor_id: str, user_id: str | None, email: str | None) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": str(vendor_id),
        "user_id": str(user_id) if user_id else None,
        "email": email,
        "iat": now,
        "exp": now + 60 * 60 * 24,
    }

    encoded_header = _base64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _base64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    message = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(
        _session_secret().encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    return f"{message}.{_base64url(signature)}"
