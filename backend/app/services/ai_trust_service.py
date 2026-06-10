import json
import logging
import urllib.error
import urllib.request

from app.core.config import settings

logger = logging.getLogger("proofpay.ai")

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


def _safe_amount_naira(payment_request: dict) -> float:
    try:
        return round(int(payment_request.get("amount_kobo", 0)) / 100, 2)
    except (TypeError, ValueError):
        return 0.0


def _normalize_reasons(reasons) -> list[str]:
    if isinstance(reasons, list):
        return [str(reason) for reason in reasons if reason]
    if isinstance(reasons, str):
        try:
            parsed = json.loads(reasons)
            if isinstance(parsed, list):
                return [str(reason) for reason in parsed if reason]
        except json.JSONDecodeError:
            return [reasons]
    return []


def _fallback_summary(vendor: dict, payment_request: dict, trust: dict) -> str:
    business_name = vendor.get("business_name") or "This vendor"
    score = trust.get("score")
    verdict = trust.get("verdict") or "Manual Review Needed"
    amount = _safe_amount_naira(payment_request)
    reasons = _normalize_reasons(trust.get("reasons"))[:2]
    reason_text = "; ".join(reasons) if reasons else "limited trust data is available"

    return (
        f"{business_name} is rated {verdict} with a trust score of {score}/100 "
        f"for this ₦{amount:,.2f} request. Key signals: {reason_text}. "
        "Review the details before paying."
    )


def _recommendation_for_verdict(verdict: str | None) -> str:
    if verdict == "Trusted":
        return "Proceed, but confirm the item and delivery details."
    if verdict == "Caution":
        return "Proceed carefully and confirm the seller details before payment."
    if verdict == "High Risk":
        return "Do extra verification before paying."
    return "Manual review is recommended before payment."


def _build_prompt(vendor: dict, payment_request: dict, trust: dict) -> list[dict]:
    amount = _safe_amount_naira(payment_request)
    payload = {
        "vendor": {
            "business_name": vendor.get("business_name"),
            "category": vendor.get("category"),
            "social_handle": vendor.get("social_handle"),
            "completed_transactions": vendor.get("completed_transactions"),
            "total_transactions": vendor.get("total_transactions"),
            "dispute_count": vendor.get("dispute_count"),
        },
        "payment_request": {
            "item_name": payment_request.get("item_name"),
            "amount_naira": amount,
            "currency": payment_request.get("currency", "NGN"),
        },
        "trust": {
            "score": trust.get("score"),
            "verdict": trust.get("verdict"),
            "confidence": trust.get("confidence"),
            "reasons": _normalize_reasons(trust.get("reasons"))[:6],
            "anomaly_warnings": trust.get("anomaly_warnings") or trust.get("features", {}).get("anomaly_flags", []),
        },
    }

    return [
        {
            "role": "system",
            "content": (
                "You are ProofPay AI, a payment-risk assistant for Nigerian student commerce. "
                "Explain payment trust signals in plain English. Do not call anyone a scammer. "
                "Be concise, fair, and buyer-focused."
            ),
        },
        {
            "role": "user",
            "content": (
                "Write one 35-70 word buyer-facing trust explanation for this payment request. "
                "Mention the verdict, strongest risk/protection signal, and what the buyer should do next. "
                f"Data: {json.dumps(payload, ensure_ascii=False, default=str)}"
            ),
        },
    ]


def generate_ai_trust_explanation(vendor: dict, payment_request: dict, trust: dict) -> dict:
    anomaly_warnings = trust.get("anomaly_warnings") or trust.get("features", {}).get("anomaly_flags", [])
    verdict = trust.get("verdict")
    fallback = {
        "summary": _fallback_summary(vendor, payment_request, trust),
        "recommendation": _recommendation_for_verdict(verdict),
        "anomaly_warnings": anomaly_warnings,
        "ai_powered": False,
        "engine": "rules-fallback",
        "model": None,
    }

    if not settings.groq_api_key:
        return fallback

    body = {
        "model": settings.groq_model,
        "messages": _build_prompt(vendor, payment_request, trust),
        "temperature": 0.2,
        "max_tokens": 130,
    }
    request = urllib.request.Request(
        GROQ_CHAT_COMPLETIONS_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
            summary = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, json.JSONDecodeError, TimeoutError, urllib.error.URLError) as exc:
        logger.warning("Groq trust explanation failed: %s", exc)
        return fallback

    return {
        **fallback,
        "summary": summary,
        "ai_powered": True,
        "engine": "groq-chat-completions",
        "model": settings.groq_model,
    }
