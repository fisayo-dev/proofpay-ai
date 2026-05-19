# backend/app/services/trust_score_service.py

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
    filled = sum(1 for f in profile_fields if f)
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
        reasons.append("Vendor profile is incomplete")

    # Factor 2: Transaction history (25 points)
    completed = vendor.get("completed_transactions", 0)
    features["completed_transactions"] = completed

    if completed >= 10:
        score += 25
        reasons.append(f"Vendor has {completed} completed transactions")
    elif completed >= 3:
        score += 15
        reasons.append(f"Vendor has {completed} completed transactions")
    elif completed >= 1:
        score += 8
        reasons.append("Vendor has limited transaction history")
    else:
        score += 2
        reasons.append("Vendor has no transaction history yet")

    # Factor 3: Dispute history (20 points)
    disputes = vendor.get("dispute_count", 0)
    total = vendor.get("total_transactions", 1)
    dispute_rate = disputes / total if total > 0 else 0
    features["dispute_rate"] = round(dispute_rate, 2)

    if disputes == 0:
        score += 20
        reasons.append("No disputes on record")
    elif dispute_rate <= 0.1:
        score += 15
        reasons.append("Very few disputes relative to transaction volume")
    elif dispute_rate <= 0.3:
        score += 8
        reasons.append("Some disputes on record - review carefully")
    else:
        score += 0
        reasons.append("High dispute rate - proceed with caution")

    # Factor 4: Account name consistency (15 points)
    bank_name = vendor.get("bank_account_name", "")
    business_name = vendor.get("business_name", "")
    name_match = any(
        word.lower() in bank_name.lower()
        for word in business_name.split()
        if len(word) > 2
    )
    features["name_consistency"] = name_match

    if bank_name and name_match:
        score += 15
        reasons.append("Account name is consistent with business name")
    elif bank_name:
        score += 8
        reasons.append("Account name provided but does not fully match business name")
    else:
        score += 0
        reasons.append("No bank account name provided")

    # Factor 5: Amount reasonableness (15 points)
    amount_kobo = payment_request.get("amount_kobo", 0)
    amount_naira = amount_kobo / 100
    features["amount_naira"] = amount_naira

    if 500 <= amount_naira <= 50000:
        score += 15
        reasons.append("Payment amount is within a normal range")
    elif amount_naira <= 200000:
        score += 8
        reasons.append("Payment amount is higher than average - verify before paying")
    else:
        score += 0
        reasons.append("Payment amount is unusually high")

    # Determine verdict
    if score >= 80:
        verdict = "Trusted"
    elif score >= 55:
        verdict = "Caution"
    elif score >= 30:
        verdict = "High Risk"
    else:
        verdict = "Manual Review Needed"

    # Determine confidence
    if completed >= 5 and bank_name:
        confidence = "high"
    elif completed >= 1 or bank_name:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "score": score,
        "verdict": verdict,
        "confidence": confidence,
        "reasons": reasons,
        "features": features,
        "model_version": "rules-v1",
    }


if __name__ == "__main__":
    vendor = {
        "business_name": "Favour Fits",
        "category": "fashion",
        "phone": "+2348012345678",
        "bank_account_name": "FAVOUR ADE",
        "social_handle": "@favourfits",
        "completed_transactions": 14,
        "total_transactions": 15,
        "dispute_count": 0,
    }

    payment_request = {
        "amount_kobo": 750000,
        "item_name": "Black hoodie",
    }

    result = calculate_trust_score(vendor, payment_request)
    print(f"score: {result['score']}")
    print(f"verdict: {result['verdict']}")
    print(f"confidence: {result['confidence']}")
    print("reasons:")
    for reason in result["reasons"]:
        print(f"  - {reason}")
