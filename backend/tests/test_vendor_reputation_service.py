import unittest

from app.services.vendor_reputation_service import (
    get_vendor_badge,
    predict_score_after_success,
)


class VendorReputationServiceTest(unittest.TestCase):
    def test_badge_thresholds(self):
        self.assertEqual(get_vendor_badge(90, 25)["key"], "top_seller")
        self.assertEqual(get_vendor_badge(78, 8)["key"], "verified")
        self.assertEqual(get_vendor_badge(62, 1)["key"], "rising_star")
        self.assertEqual(get_vendor_badge(20, 0)["key"], "new_vendor")

    def test_predict_score_after_success_caps_at_100(self):
        result = predict_score_after_success(99, 30)

        self.assertEqual(result["predicted_score"], 100)
        self.assertEqual(result["delta"], 1)


if __name__ == "__main__":
    unittest.main()
