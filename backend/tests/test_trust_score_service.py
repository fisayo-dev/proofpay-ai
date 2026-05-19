import unittest

from app.services.trust_score_service import calculate_trust_score


class TrustScoreServiceTest(unittest.TestCase):
    def test_calculates_trusted_score_for_complete_vendor(self):
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

        self.assertEqual(result["score"], 95)
        self.assertEqual(result["verdict"], "Trusted")
        self.assertEqual(result["confidence"], "high")
        self.assertEqual(
            result["reasons"],
            [
                "Vendor profile is fully complete",
                "Vendor has 14 completed transactions",
                "No disputes on record",
                "Account name is consistent with business name",
                "Payment amount is within a normal range",
            ],
        )
        self.assertEqual(result["model_version"], "rules-v1")


if __name__ == "__main__":
    unittest.main()
