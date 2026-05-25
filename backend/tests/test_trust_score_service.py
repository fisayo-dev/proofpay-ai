import unittest

from app.services.trust_score_service import calculate_trust_score


class TrustScoreServiceTest(unittest.TestCase):
    def test_scores_day3_vendor_profiles_with_distinct_verdicts(self):
        vendor_a = {
            "business_name": "Favour Fits",
            "category": "fashion",
            "phone": "+2348012345678",
            "bank_account_name": "FAVOUR ADE",
            "social_handle": "@favourfits",
            "completed_transactions": 14,
            "total_transactions": 15,
            "dispute_count": 0,
        }
        request_a = {"amount_kobo": 750000}

        vendor_b = {
            "business_name": "Quick Sales",
            "category": "gadgets",
            "phone": "+2348099999999",
            "bank_account_name": None,
            "social_handle": None,
            "completed_transactions": 3,
            "total_transactions": 5,
            "dispute_count": 1,
        }
        request_b = {"amount_kobo": 3000000}

        vendor_c = {
            "business_name": "Fresh Eats",
            "category": "food",
            "phone": None,
            "bank_account_name": None,
            "social_handle": None,
            "completed_transactions": 0,
            "total_transactions": 0,
            "dispute_count": 0,
        }
        request_c = {"amount_kobo": 300000}

        result_a = calculate_trust_score(vendor_a, request_a)
        result_b = calculate_trust_score(vendor_b, request_b)
        result_c = calculate_trust_score(vendor_c, request_c)

        self.assertEqual(result_a["score"], 95)
        self.assertEqual(result_a["verdict"], "Trusted")
        self.assertEqual(result_a["confidence"], "high")

        self.assertTrue(55 <= result_b["score"] <= 79)
        self.assertEqual(result_b["verdict"], "Caution")

        self.assertTrue(30 <= result_c["score"] <= 54)
        self.assertEqual(result_c["verdict"], "High Risk")

        verdicts = {result_a["verdict"], result_b["verdict"], result_c["verdict"]}
        self.assertEqual(len(verdicts), 3)
        for result in (result_a, result_b, result_c):
            self.assertGreaterEqual(len(result["reasons"]), 5)
            self.assertEqual(result["model_version"], "rules-v1-anomaly")

    def test_applies_anomaly_multiplier_to_large_new_vendor_payment(self):
        vendor = {
            "business_name": "Quick Cash",
            "category": "gadgets",
            "phone": None,
            "bank_account_name": None,
            "social_handle": None,
            "completed_transactions": 0,
            "total_transactions": 0,
            "dispute_count": 0,
        }
        payment_request = {"amount_kobo": 15000000}

        result = calculate_trust_score(vendor, payment_request)

        self.assertEqual(result["score"], 30)
        self.assertEqual(result["verdict"], "High Risk")
        self.assertEqual(result["features"]["risk_multiplier"], 0.84)
        self.assertEqual(len(result["features"]["anomaly_flags"]), 4)
        self.assertIn(
            "Large payment requested from a vendor with very few transactions",
            result["reasons"],
        )

    def test_keeps_trusted_vendor_score_when_no_anomaly_detected(self):
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
        payment_request = {"amount_kobo": 750000}

        result = calculate_trust_score(vendor, payment_request)

        self.assertEqual(result["score"], 95)
        self.assertEqual(result["verdict"], "Trusted")
        self.assertEqual(result["features"]["risk_multiplier"], 1.0)
        self.assertEqual(result["features"]["anomaly_flags"], [])

    def test_zero_amount_returns_valid_manual_review_score(self):
        vendor = {
            "business_name": "Test",
            "category": "food",
            "completed_transactions": 0,
            "total_transactions": 0,
            "dispute_count": 0,
        }
        payment_request = {"amount_kobo": 0}

        result = calculate_trust_score(vendor, payment_request)

        self.assertIsInstance(result["score"], int)
        self.assertEqual(result["verdict"], "Manual Review Needed")
        self.assertEqual(result["features"]["amount_naira"], 0)
        self.assertEqual(result["model_version"], "rules-v1-anomaly")

    def test_empty_vendor_and_request_returns_manual_review_without_crashing(self):
        result = calculate_trust_score({}, {})

        self.assertIsInstance(result["score"], int)
        self.assertEqual(result["verdict"], "Manual Review Needed")
        self.assertEqual(result["confidence"], "low")
        self.assertGreaterEqual(len(result["reasons"]), 5)
        self.assertEqual(result["model_version"], "rules-v1-anomaly")


if __name__ == "__main__":
    unittest.main()
