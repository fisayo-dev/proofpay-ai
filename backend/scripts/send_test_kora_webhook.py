"""Send a signed test Kora webhook to the live ProofPay backend.

Usage:
  set KORA_SECRET_KEY=your-secret
  python backend/scripts/send_test_kora_webhook.py

This utility does not hardcode secrets. It reads KORA_SECRET_KEY from the
environment and signs the payload data object, matching Kora's webhook docs.
"""

from __future__ import annotations

import argparse
import hmac
import hashlib
import json
import os
from collections import OrderedDict
from urllib import error, request

DEFAULT_WEBHOOK_URL = "https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/payments/kora/webhook"
DEFAULT_REFERENCE = "PPAY-20260525-JYXB7GDO"
DEFAULT_AMOUNT = 7500
DEFAULT_CURRENCY = "NGN"


def build_payload(reference: str, amount: int, currency: str) -> OrderedDict:
    return OrderedDict(
        [
            ("event", "charge.success"),
            (
                "data",
                OrderedDict(
                    [
                        ("amount", amount),
                        ("status", "success"),
                        ("currency", currency),
                        ("reference", reference),
                        ("payment_reference", reference),
                        ("payment_method", "card"),
                    ]
                ),
            ),
        ]
    )


def canonical_json(payload: OrderedDict) -> str:
    return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)


def sign_payload(payload: OrderedDict, secret_key: str) -> str:
    message = canonical_json(payload["data"])
    return hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def post_webhook(webhook_url: str, payload: OrderedDict, signature: str) -> tuple[int, str]:
    body = canonical_json(payload).encode("utf-8")
    req = request.Request(
        webhook_url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-korapay-signature": signature,
        },
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            return response.status, response.read().decode("utf-8")
    except error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send a signed Kora test webhook.")
    parser.add_argument("--webhook-url", default=DEFAULT_WEBHOOK_URL)
    parser.add_argument("--reference", default=DEFAULT_REFERENCE)
    parser.add_argument("--amount", type=int, default=DEFAULT_AMOUNT)
    parser.add_argument("--currency", default=DEFAULT_CURRENCY)
    parser.add_argument("--secret-env", default="KORA_SECRET_KEY")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    secret_key = os.getenv(args.secret_env, "")
    if not secret_key:
        raise SystemExit(f"Missing {args.secret_env} environment variable")

    payload = build_payload(args.reference, args.amount, args.currency)
    signature = sign_payload(payload, secret_key)
    status_code, response_text = post_webhook(args.webhook_url, payload, signature)

    print(json.dumps({
        "webhook_url": args.webhook_url,
        "payload": payload,
        "signature": signature,
        "status_code": status_code,
        "response": response_text,
    }, indent=2))
    return 0 if 200 <= status_code < 300 else 1


if __name__ == "__main__":
    raise SystemExit(main())
