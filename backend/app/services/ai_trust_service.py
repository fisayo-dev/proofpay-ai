import json
import logging
import urllib.error
import urllib.request
from typing import Any

from app.core.config import settings

logger = logging.getLogger("proofpay.ai")

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
]


def _normalize_secret(value: str | None) -> str:
    return (value or "").strip().strip('"').strip("'")


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


def _call_groq_sdk(api_key: str, model: str, messages: list[dict]) -> str:
    from groq import Groq

    client = Groq(api_key=api_key)
    chat = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.2,
        max_tokens=130,
    )
    return chat.choices[0].message.content.strip()


def _call_groq_http(api_key: str, model: str, messages: list[dict]) -> str:
    body = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 130,
    }
    request = urllib.request.Request(
        GROQ_CHAT_COMPLETIONS_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "ProofPayAI/1.0",
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=8) as response:
        data = json.loads(response.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()


def _extract_error_detail(exc: Exception) -> tuple[int | None, str]:
    status_code = getattr(exc, "status_code", None)
    response = getattr(exc, "response", None)
    if response is not None:
        status_code = getattr(response, "status_code", status_code)
        try:
            body: Any = response.text
        except Exception:
            body = str(exc)
        return status_code, str(body)[:500]

    if isinstance(exc, urllib.error.HTTPError):
        body = exc.read().decode("utf-8", errors="replace")
        return exc.code, body[:500]

    return status_code, str(exc)[:500]


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

    groq_api_key = _normalize_secret(settings.groq_api_key)
    if not groq_api_key:
        return fallback

    messages = _build_prompt(vendor, payment_request, trust)
    models_to_try = []
    primary_model = (settings.groq_model or "").strip()
    if primary_model:
        models_to_try.append(primary_model)
    for model in GROQ_FALLBACK_MODELS:
        if model not in models_to_try:
            models_to_try.append(model)

    last_error = None
    for model in models_to_try:
        for client_name, client_call in (
            ("groq-sdk", _call_groq_sdk),
            ("groq-http", _call_groq_http),
        ):
            try:
                summary = client_call(groq_api_key, model, messages)
                return {
                    **fallback,
                    "summary": summary,
                    "ai_powered": True,
                    "engine": client_name,
                    "model": model,
                }
            except Exception as exc:
                status_code, detail = _extract_error_detail(exc)
                last_error = f"HTTP {status_code}: {detail}" if status_code else detail
                logger.warning(
                    "Groq trust explanation failed client=%s model=%s: %s",
                    client_name,
                    model,
                    last_error,
                )
                if status_code not in {403, 404}:
                    break

    if last_error:
        logger.warning("Groq trust explanation fell back to rules: %s", last_error)
        return fallback
    return fallback


def _call_groq_with_fallback(messages: list[dict], max_tokens: int = 240) -> tuple[str | None, str | None]:
    groq_api_key = _normalize_secret(settings.groq_api_key)
    if not groq_api_key:
        return None, None

    models_to_try = []
    primary_model = (settings.groq_model or "").strip()
    if primary_model:
        models_to_try.append(primary_model)
    for model in GROQ_FALLBACK_MODELS:
        if model not in models_to_try:
            models_to_try.append(model)

    for model in models_to_try:
        body = {
            "model": model,
            "messages": messages,
            "temperature": 0.25,
            "max_tokens": max_tokens,
        }
        request = urllib.request.Request(
            GROQ_CHAT_COMPLETIONS_URL,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
                "User-Agent": "ProofPayAI/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                data = json.loads(response.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"].strip(), model
        except Exception as exc:
            status_code, detail = _extract_error_detail(exc)
            logger.warning(
                "Groq advisory call failed model=%s status=%s detail=%s",
                model,
                status_code,
                detail,
            )
            if status_code not in {403, 404}:
                break

    return None, None


def _parse_jsonish_response(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        text = text.removeprefix("```json").removeprefix("```").strip()
        text = text.removesuffix("```").strip()
    return json.loads(text)


def _fallback_vendor_advice(vendor: dict, analytics: dict) -> list[str]:
    suggestions = []
    trust_score = int(analytics.get("trust_score") or vendor.get("trust_score") or 0)
    completion_rate = float(analytics.get("completion_rate") or 0)
    disputes = int(analytics.get("dispute_count") or vendor.get("dispute_count") or 0)
    completed = int(analytics.get("completed_transactions") or vendor.get("completed_transactions") or 0)
    pending = int(analytics.get("pending_count") or 0)

    if trust_score < 75:
        suggestions.append("Complete more Kora-verified payments so buyers can see stronger transaction history.")
    if completed < 5:
        suggestions.append("Start with smaller, fast-delivery items to build at least five completed transactions.")
    if completion_rate < 0.8 and analytics.get("total_requests"):
        suggestions.append("Reduce abandoned or pending requests by confirming stock, price, and delivery before sharing links.")
    if disputes > 0:
        suggestions.append("Resolve disputes quickly and document delivery clearly to protect your trust score.")
    if pending > 0:
        suggestions.append("Follow up on pending buyers with one WhatsApp reminder and a clear delivery promise.")
    if not suggestions:
        suggestions.append("Keep your profile complete, delivery promises clear, and response time fast to maintain buyer confidence.")

    return suggestions[:4]


def generate_vendor_growth_advice(vendor: dict, analytics: dict) -> dict:
    fallback_suggestions = _fallback_vendor_advice(vendor, analytics)
    fallback = {
        "summary": (
            f"{vendor.get('business_name') or 'This vendor'} can improve trust by focusing on "
            f"completed payments, clear delivery evidence, and fewer unresolved issues."
        ),
        "suggestions": fallback_suggestions,
        "ai_powered": False,
        "model": None,
    }

    messages = [
        {
            "role": "system",
            "content": (
                "You are ProofPay AI, a Nigerian fintech growth advisor for student vendors. "
                "Give practical, ethical advice that improves buyer trust and payment conversion. "
                "Do not invent metrics."
            ),
        },
        {
            "role": "user",
            "content": (
                "Using this vendor profile and analytics, return JSON only with keys "
                "summary and suggestions. suggestions must be 3-4 short, specific actions. "
                f"Vendor: {json.dumps(vendor, ensure_ascii=False, default=str)}. "
                f"Analytics: {json.dumps(analytics, ensure_ascii=False, default=str)}"
            ),
        },
    ]

    content, model = _call_groq_with_fallback(messages, max_tokens=260)
    if not content:
        return fallback

    try:
        parsed = _parse_jsonish_response(content)
        suggestions = parsed.get("suggestions")
        if not isinstance(suggestions, list):
            raise ValueError("suggestions must be a list")
        return {
            "summary": str(parsed.get("summary") or fallback["summary"]),
            "suggestions": [str(item) for item in suggestions if item][:4],
            "ai_powered": True,
            "model": model,
        }
    except Exception:
        return {
            **fallback,
            "summary": content[:500],
            "ai_powered": True,
            "model": model,
        }


def generate_buyer_recommendation_summary(products: list[dict]) -> dict:
    if not products:
        return {
            "summary": "No live products are available yet.",
            "ai_powered": False,
            "model": None,
        }

    compact_products = [
        {
            "item": product.get("payment_request", {}).get("item_name"),
            "vendor": product.get("vendor", {}).get("business_name"),
            "category": product.get("vendor", {}).get("category"),
            "price": product.get("payment_request", {}).get("amount"),
            "trust_score": product.get("trust", {}).get("score"),
            "verdict": product.get("trust", {}).get("verdict"),
            "completed_sales": product.get("vendor", {}).get("completed_transactions"),
        }
        for product in products[:8]
    ]

    top = max(
        compact_products,
        key=lambda item: (
            int(item.get("trust_score") or 0),
            int(item.get("completed_sales") or 0),
        ),
    )
    fallback = {
        "summary": (
            f"Start with {top.get('item')} from {top.get('vendor')}: it has one of the strongest "
            f"trust profiles available right now."
        ),
        "ai_powered": False,
        "model": None,
    }

    messages = [
        {
            "role": "system",
            "content": (
                "You are ProofPay AI, a buyer recommendation assistant. Recommend products using only "
                "provided trust, popularity, category, and price data. Do not invent sales."
            ),
        },
        {
            "role": "user",
            "content": (
                "Write one concise buyer-facing recommendation summary under 60 words. "
                "Mention what looks popular or trusted and how buyers should choose safely. "
                f"Products: {json.dumps(compact_products, ensure_ascii=False, default=str)}"
            ),
        },
    ]

    content, model = _call_groq_with_fallback(messages, max_tokens=140)
    if not content:
        return fallback

    return {
        "summary": content,
        "ai_powered": True,
        "model": model,
    }
