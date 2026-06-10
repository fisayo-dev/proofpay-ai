# backend/app/services/trust_score_service.py

from app.services.anomaly_service import detect_anomalies

CATEGORY_AMOUNT_RANGES_NAIRA = {
    "food": (500, 15000),
    "fashion": (1000, 80000),
    "gadgets": (5000, 500000),
    "services": (1000, 100000),
    "tickets": (500, 50000),
    "other": (500, 100000),
}


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def typical_amount_kobo_for_category(category: str | None) -> int:
    normalized = str(category or "other").lower()
    low, high = CATEGORY_AMOUNT_RANGES_NAIRA.get(
        normalized,
        CATEGORY_AMOUNT_RANGES_NAIRA["other"],
    )
    return int(((low + high) / 2) * 100)


def calculate_trust_score(vendor: dict, payment_request: dict) -> dict:
    score = 0
    reasons = []
    features = {}

    # Factor 1: Profile completeness (20 points)
    profile_fields = [
        vendor.get("business_name"),
        vendor.get("category"),
        vendor.get("phone"),
        vendor.get("bank_account_name"),
        vendor.get("social_handle"),
    ]
    filled = sum(1 for field in profile_fields if field and str(field).strip())
    completion_rate = filled / len(profile_fields)
    features["profile_completeness"] = round(completion_rate, 2)

    if completion_rate == 1.0:
        score += 20
        reasons.append("Vendor profile is fully complete")
    elif completion_rate >= 0.6:
        score += 12
        reasons.append("Vendor profile is mostly complete")
    else:
        score += 4
        reasons.append("Vendor profile is incomplete - missing key details")

    # Factor 2: Transaction history (25 points)
    completed = _safe_int(vendor.get("completed_transactions", 0))
    total = _safe_int(vendor.get("total_transactions", 0))
    features["completed_transactions"] = completed
    features["total_transactions"] = total

    if completed >= 20:
        score += 25
        reasons.append(f"Vendor has {completed} completed transactions - strong history")
    elif completed >= 10:
        score += 20
        reasons.append(f"Vendor has {completed} completed transactions")
    elif completed >= 5:
        score += 14
        reasons.append(f"Vendor has {completed} completed transactions - growing history")
    elif completed >= 3:
        score += 15
        reasons.append(f"Vendor has {completed} completed transactions - early history")
    elif completed >= 1:
        score += 7
        reasons.append(f"Vendor has {completed} completed transaction(s) - limited history")
    else:
        score += 2
        reasons.append("Vendor has no completed transactions yet - new seller")

    # Factor 3: Dispute history (25 points)
    disputes = _safe_int(vendor.get("dispute_count", 0))
    dispute_rate = disputes / total if total > 0 else 0
    features["dispute_count"] = disputes
    features["dispute_rate"] = round(dispute_rate, 3)

    if total == 0:
        score += 15
        reasons.append("No dispute history yet - not enough completed transactions")
    elif disputes == 0:
        score += 25
        reasons.append("No disputes on record")
    elif dispute_rate <= 0.05:
        score += 20
        reasons.append("Very low dispute rate - highly reliable")
    elif dispute_rate <= 0.15:
        score += 12
        reasons.append("Some disputes on record - review before paying")
    elif dispute_rate <= 0.30:
        score += 13
        reasons.append("Notable dispute history - proceed carefully")
    else:
        score += 0
        reasons.append("High dispute rate - exercise significant caution")

    # Factor 4: Account name consistency (15 points)
    bank_name = str(vendor.get("bank_account_name", "") or "").strip().lower()
    business_name = str(vendor.get("business_name", "") or "").strip().lower()

    meaningful_words = [
        word for word in business_name.split()
        if len(word) > 2 and word not in {"the", "and", "for", "ltd", "co"}
    ]
    name_match = any(word in bank_name for word in meaningful_words)
    features["bank_account_name_provided"] = bool(bank_name)
    features["name_consistency"] = name_match

    if bank_name and name_match:
        score += 15
        reasons.append("Account name is consistent with business name")
    elif bank_name and not name_match:
        score += 8
        reasons.append("Account name provided but does not match business name - verify identity")
    else:
        score += 0
        reasons.append("No bank account name provided")

    # Factor 5: Amount reasonableness (15 points)
    amount_kobo = _safe_int(payment_request.get("amount_kobo", 0))
    amount_naira = amount_kobo / 100
    features["amount_naira"] = amount_naira

    category = str(vendor.get("category", "") or "").lower()
    low, high = CATEGORY_AMOUNT_RANGES_NAIRA.get(
        category,
        CATEGORY_AMOUNT_RANGES_NAIRA["other"],
    )

    if amount_naira <= 0:
        score += 0
        reasons.append("Payment amount is missing or invalid")
    elif low <= amount_naira <= high:
        score += 15
        reasons.append("Payment amount is normal for this vendor category")
    elif amount_naira < low:
        score += 10
        reasons.append("Payment amount is lower than typical for this category")
    elif amount_naira <= high * 2:
        score += 7
        reasons.append("Payment amount is above average - confirm item details")
    else:
        score += 0
        reasons.append("Payment amount is unusually high for this category")

    data_richness = sum([
        completed >= 3,
        bool(bank_name),
        total >= 3,
        completion_rate >= 0.8,
    ])

    if data_richness >= 3:
        confidence = "high"
    elif data_richness >= 2:
        confidence = "medium"
    else:
        confidence = "low"

    anomaly_result = detect_anomalies(vendor, payment_request)

    if anomaly_result["anomaly_detected"]:
        adjusted_score = round(score * anomaly_result["risk_multiplier"])
        reasons.extend(anomaly_result["anomaly_flags"])
    else:
        adjusted_score = score

    if adjusted_score >= 80:
        verdict = "Trusted"
    elif adjusted_score >= 55:
        verdict = "Caution"
    elif adjusted_score >= 30:
        verdict = "High Risk"
    else:
        verdict = "Manual Review Needed"

    features["anomaly_flags"] = anomaly_result["anomaly_flags"]
    features["risk_multiplier"] = anomaly_result["risk_multiplier"]
    features["xgboost"] = anomaly_result.get("xgboost")

    return {
        "score": adjusted_score,
        "verdict": verdict,
        "confidence": confidence,
        "reasons": reasons,
        "features": features,
        "model_version": "rules-v1-anomaly",
    }


if __name__ == "__main__":
    samples = [
        (
            "Trusted vendor",
            {
                "business_name": "Favour Fits",
                "category": "fashion",
                "phone": "+2348012345678",
                "bank_account_name": "FAVOUR ADE",
                "social_handle": "@favourfits",
                "completed_transactions": 14,
                "total_transactions": 15,
                "dispute_count": 0,
            },
            {"amount_kobo": 750000},
        ),
        (
            "Caution vendor",
            {
                "business_name": "Quick Sales",
                "category": "gadgets",
                "phone": "+2348099999999",
                "bank_account_name": None,
                "social_handle": None,
                "completed_transactions": 3,
                "total_transactions": 5,
                "dispute_count": 1,
            },
            {"amount_kobo": 5000000},
        ),
        (
            "New vendor",
            {
                "business_name": "Fresh Eats",
                "category": "food",
                "phone": None,
                "bank_account_name": None,
                "social_handle": None,
                "completed_transactions": 0,
                "total_transactions": 0,
                "dispute_count": 0,
            },
            {"amount_kobo": 300000},
        ),
    ]

    for label, vendor, request in samples:
        result = calculate_trust_score(vendor, request)
        print(label)
        print(f"score: {result['score']}")
        print(f"verdict: {result['verdict']}")
        print(f"confidence: {result['confidence']}")
        print("reasons:")
        for reason in result["reasons"]:
            print(f"  - {reason}")
        print()
