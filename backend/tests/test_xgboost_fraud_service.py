import unittest

from app.services.xgboost_fraud_service import (
    build_fraud_features,
    score_xgboost_fraud_risk,
)


class XGBoostFraudServiceTest(unittest.TestCase):
    def test_builds_numeric_features_for_model(self):
        features = build_fraud_features(
            {
                "business_name": "Favour Fits",
                "category": "fashion",
                "phone": "+2348012345678",
                "bank_account_name": "FAVOUR FITS",
                "social_handle": "@favourfits",
                "completed_transactions": 10,
                "total_transactions": 12,
                "dispute_count": 1,
            },
            {"amount_kobo": 750000},
        )

        self.assertEqual(features["amount_naira"], 7500)
        self.assertEqual(features["profile_completeness"], 1.0)
        self.assertEqual(features["completed_transactions"], 10)

    def test_returns_rules_only_when_model_unavailable(self):
        result = score_xgboost_fraud_risk({}, {"amount_kobo": 100000})

        self.assertFalse(result["available"])
        self.assertEqual(result["risk_label"], "rules_only")
        self.assertIn("features", result)


if __name__ == "__main__":
    unittest.main()
