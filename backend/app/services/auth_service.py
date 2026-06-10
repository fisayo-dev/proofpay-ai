# backend/app/services/auth_service.py

import base64
import hashlib
import hmac
import json
import time
from typing import Any

from app.core.config import settings


def _base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _session_secret() -> str:
    return (
        settings.session_secret
        or settings.supabase_service_role_key
        or "dev-proofpay-session-secret"
    )


def hash_password(password: str | None) -> str | None:
    if not password:
        return None

    salt = hashlib.sha256(_session_secret().encode("utf-8")).hexdigest()[:16]
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return f"pbkdf2_sha256${salt}${_base64url(digest)}"


def verify_password(password: str | None, password_hash: str | None) -> bool:
    if not password_hash:
        return True
    if not password or not password_hash.startswith("pbkdf2_sha256$"):
        return False

    _, salt, expected = password_hash.split("$", 2)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return hmac.compare_digest(_base64url(digest), expected)


def create_session_token(
    vendor_id: str | None,
    user_id: str | None,
    email: str | None,
    role: str = "vendor",
) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": str(vendor_id or user_id or ""),
        "vendor_id": str(vendor_id) if vendor_id else None,
        "user_id": str(user_id) if user_id else None,
        "email": email,
        "role": role,
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


def public_session_payload(account: dict[str, Any]) -> dict[str, Any]:
    trust_score = account.get("trust_score")
    if trust_score is not None:
        trust_score = float(trust_score)

    return {
        "user_id": str(account["user_id"]) if account.get("user_id") else None,
        "vendor_id": str(account["vendor_id"]) if account.get("vendor_id") else None,
        "role": account.get("role", "vendor"),
        "full_name": account.get("full_name") or "",
        "email": account.get("email") or "",
        "business_name": account.get("business_name") or "",
        "trust_score": trust_score,
        "created_at": str(account["created_at"]) if account.get("created_at") else None,
    }
