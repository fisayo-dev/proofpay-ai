import unittest

from app.services.anomaly_service import detect_anomalies


class AnomalyServiceTest(unittest.TestCase):
    def test_flags_large_payment_from_new_incomplete_vendor(self):
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

        result = detect_anomalies(vendor, payment_request)

        self.assertTrue(result["anomaly_detected"])
        self.assertEqual(result["risk_multiplier"], 0.84)
        self.assertEqual(
            result["anomaly_flags"],
            [
                "Large payment requested from a vendor with very few transactions",
                "Vendor has no completed transactions - payment carries higher risk",
                "Vendor profile is incomplete for a payment of this size",
                "Payment amount is a large round number - verify item details",
            ],
        )

    def test_does_not_flag_trusted_vendor_with_normal_amount(self):
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

        result = detect_anomalies(vendor, payment_request)

        self.assertFalse(result["anomaly_detected"])
        self.assertEqual(result["risk_multiplier"], 1.0)
        self.assertEqual(result["anomaly_flags"], [])


if __name__ == "__main__":
    unittest.main()
