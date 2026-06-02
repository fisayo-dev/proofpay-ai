# backend/app/services/kora_service.py

import json
from urllib import error, request

from app.core.config import settings

KORA_CHARGE_QUERY_URL = "https://api.korapay.com/merchant/api/v1/charges/{reference}"


class KoraVerificationError(Exception):
    pass


def _as_amount(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def verify_kora_charge(kora_reference: str) -> dict:
    secret_key = settings.kora_secret_key.strip()
    if not secret_key:
        raise KoraVerificationError("Kora secret key is not configured.")

    api_request = request.Request(
        KORA_CHARGE_QUERY_URL.format(reference=kora_reference),
        method="GET",
        headers={
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with request.urlopen(api_request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (error.HTTPError, error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise KoraVerificationError("Could not verify Kora charge.") from exc

    data = payload.get("data") or {}
    return {
        "reference": data.get("reference") or data.get("payment_reference") or kora_reference,
        "status": str(data.get("status") or "").lower(),
        "amount": _as_amount(data.get("amount_paid", data.get("amount"))),
        "currency": data.get("currency"),
        "raw": payload,
    }
