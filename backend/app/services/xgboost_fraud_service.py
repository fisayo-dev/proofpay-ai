from __future__ import annotations

import os
from functools import lru_cache


FEATURE_ORDER = [
    "amount_naira",
    "completed_transactions",
    "total_transactions",
    "dispute_count",
    "profile_completeness",
    "amount_to_history_ratio",
]


def build_fraud_features(vendor: dict, payment_request: dict) -> dict:
    amount_kobo = _safe_float(payment_request.get("amount_kobo"), 0)
    amount_naira = amount_kobo / 100
    completed = _safe_float(vendor.get("completed_transactions"), 0)
    total = _safe_float(vendor.get("total_transactions"), completed)
    disputes = _safe_float(vendor.get("dispute_count"), 0)
    profile_fields = [
        vendor.get("business_name"),
        vendor.get("category"),
        vendor.get("phone"),
        vendor.get("bank_account_name"),
        vendor.get("social_handle"),
    ]
    filled = sum(1 for field in profile_fields if field and str(field).strip())
    profile_completeness = filled / len(profile_fields)
    amount_to_history_ratio = amount_naira / max(completed, 1)

    return {
        "amount_naira": amount_naira,
        "completed_transactions": completed,
        "total_transactions": total,
        "dispute_count": disputes,
        "profile_completeness": round(profile_completeness, 3),
        "amount_to_history_ratio": round(amount_to_history_ratio, 3),
    }


def _safe_float(value, default: float = 0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


@lru_cache(maxsize=1)
def _load_xgboost_model():
    model_path = os.getenv("XGBOOST_FRAUD_MODEL_PATH", "").strip()
    if not model_path:
        return None

    try:
        import xgboost as xgb
    except Exception:
        return None

    if not os.path.exists(model_path):
        return None

    model = xgb.Booster()
    model.load_model(model_path)
    return model


def score_xgboost_fraud_risk(vendor: dict, payment_request: dict) -> dict:
    features = build_fraud_features(vendor, payment_request)
    model = _load_xgboost_model()

    if model is None:
        return {
            "available": False,
            "risk_probability": None,
            "risk_label": "rules_only",
            "features": features,
            "reason": "XGBoost model unavailable; deterministic fraud rules used.",
        }

    try:
        import xgboost as xgb

        values = [[features[name] for name in FEATURE_ORDER]]
        matrix = xgb.DMatrix(values, feature_names=FEATURE_ORDER)
        probability = float(model.predict(matrix)[0])
    except Exception as exc:
        return {
            "available": False,
            "risk_probability": None,
            "risk_label": "rules_only",
            "features": features,
            "reason": f"XGBoost scoring failed: {exc}",
        }

    if probability >= 0.75:
        label = "high"
    elif probability >= 0.45:
        label = "medium"
    else:
        label = "low"

    return {
        "available": True,
        "risk_probability": round(probability, 4),
        "risk_label": label,
        "features": features,
        "reason": "XGBoost fraud model scored this payment context.",
    }
