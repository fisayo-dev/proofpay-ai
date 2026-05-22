import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.api.v1 import routes_demo
from app.api.v1.routes_demo import demo_scenarios, demo_trust_score, seed_demo_data


class FakeCursor:
    def __init__(self):
        self.queries = []

    def execute(self, query, params):
        self.queries.append((query, params))


class FakeConnection:
    def __init__(self):
        self.cursor_instance = FakeCursor()
        self.committed = False
        self.closed = False

    def cursor(self):
        return self.cursor_instance

    def commit(self):
        self.committed = True

    def close(self):
        self.closed = True


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

    def test_seed_demo_data_creates_vendor_history_and_request(self):
        conn = FakeConnection()
        payment_result = {
            "payment_request_id": "req_123",
            "public_slug": "ppai_DEMO",
            "public_url": "https://frontend.test/r/ppai_DEMO",
            "kora_reference": "PPAY-20260522-DEMO",
            "trust": {"score": 95, "verdict": "Trusted"},
        }

        with (
            patch.object(routes_demo, "create_vendor", return_value={"id": "vendor_123"}),
            patch.object(routes_demo, "get_connection", return_value=conn),
            patch.object(routes_demo, "create_payment_request", return_value=payment_result),
        ):
            response = seed_demo_data()

        self.assertEqual(response["message"], "Demo data seeded successfully.")
        self.assertEqual(response["vendor_id"], "vendor_123")
        self.assertEqual(response["payment_request_id"], "req_123")
        self.assertEqual(response["public_slug"], "ppai_DEMO")
        self.assertEqual(response["trust"], payment_result["trust"])

        query, params = conn.cursor_instance.queries[0]
        self.assertIn("completed_transactions = 14", query)
        self.assertIn("total_transactions = 15", query)
        self.assertIn("dispute_count = 0", query)
        self.assertEqual(params[1], "vendor_123")
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)

    def test_seed_demo_data_returns_seed_failed_error(self):
        with patch.object(routes_demo, "create_vendor", side_effect=RuntimeError("boom")):
            with self.assertRaises(HTTPException) as context:
                seed_demo_data()

        self.assertEqual(context.exception.status_code, 500)
        self.assertEqual(context.exception.detail["code"], "SEED_FAILED")


if __name__ == "__main__":
    unittest.main()
