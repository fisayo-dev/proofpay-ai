import unittest

from app.api.v1.routes_demo import demo_scenarios, demo_trust_score


class DemoRoutesTest(unittest.TestCase):
    def test_demo_trust_score_returns_buyer_page_sample(self):
        response = demo_trust_score()

        self.assertIn("ProofPay AI hackathon", response["note"])
        self.assertEqual(response["vendor"]["business_name"], "Favour Fits")
        self.assertEqual(response["payment_request"]["item_name"], "Black hoodie")
        self.assertEqual(response["payment_request"]["amount"], 7500)
        self.assertEqual(response["trust"]["score"], 95)
        self.assertEqual(response["trust"]["verdict"], "Trusted")
        self.assertGreaterEqual(len(response["trust"]["reasons"]), 5)

    def test_demo_scenarios_returns_three_scoring_ranges(self):
        response = demo_scenarios()

        self.assertEqual(response["note"], "Three scoring scenarios for ProofPay AI demo.")
        self.assertEqual(len(response["scenarios"]), 3)

        labels = [scenario["label"] for scenario in response["scenarios"]]
        verdicts = [scenario["verdict"] for scenario in response["scenarios"]]

        self.assertEqual(labels, ["Trusted Vendor", "Caution Vendor", "High Risk Vendor"])
        self.assertIn("Trusted", verdicts)
        self.assertIn("Caution", verdicts)
        self.assertIn("Manual Review Needed", verdicts)

        for scenario in response["scenarios"]:
            self.assertIsInstance(scenario["score"], int)
            self.assertGreaterEqual(len(scenario["reasons"]), 5)


if __name__ == "__main__":
    unittest.main()
