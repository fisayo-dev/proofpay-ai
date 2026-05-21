# backend/app/services/anomaly_service.py


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def detect_anomalies(vendor: dict, payment_request: dict) -> dict:
    """
    Simple rule-based anomaly detection.
    Returns anomaly flags and a risk multiplier for the trust score layer.
    """
    flags = []
    risk_multiplier = 1.0

    amount_kobo = _safe_int(payment_request.get("amount_kobo", 0))
    amount_naira = amount_kobo / 100
    completed = _safe_int(vendor.get("completed_transactions", 0))
    disputes = _safe_int(vendor.get("dispute_count", 0))
    total = _safe_int(vendor.get("total_transactions", 0))

    if amount_naira > 20000 and completed < 3:
        flags.append("Large payment requested from a vendor with very few transactions")
        risk_multiplier *= 0.80

    if total > 0:
        dispute_rate = disputes / total
        if dispute_rate > 0.4:
            flags.append("Vendor dispute rate is unusually high")
            risk_multiplier *= 0.75

    if completed == 0 and amount_naira > 5000:
        flags.append("Vendor has no completed transactions - payment carries higher risk")
        risk_multiplier *= 0.85

    profile_fields = [
        vendor.get("business_name"),
        vendor.get("phone"),
        vendor.get("bank_account_name"),
    ]
    filled = sum(1 for field in profile_fields if field and str(field).strip())
    if filled < 2 and amount_naira > 10000:
        flags.append("Vendor profile is incomplete for a payment of this size")
        risk_multiplier *= 0.85

    if amount_naira >= 50000 and amount_naira % 10000 == 0:
        flags.append("Payment amount is a large round number - verify item details")
        risk_multiplier *= 0.95

    return {
        "anomaly_flags": flags,
        "risk_multiplier": round(risk_multiplier, 3),
        "anomaly_detected": len(flags) > 0,
    }
