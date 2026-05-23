import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.api.v1 import routes_demo
from app.api.v1.routes_demo import (
    demo_scenarios,
    demo_trust_score,
    seed_demo_data,
    simulate_payment_success,
)


class FakeCursor:
    def __init__(self, row=None):
        self.queries = []
        self.row = row

    def execute(self, query, params):
        self.queries.append((query, params))

    def fetchone(self):
        return self.row


class FakeConnection:
    def __init__(self, row=None):
        self.cursor_instance = FakeCursor(row)
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

    def test_simulate_payment_success_requires_payment_request_id(self):
        with self.assertRaises(HTTPException) as context:
            simulate_payment_success({})

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "VALIDATION_ERROR")

    def test_simulate_payment_success_returns_404_when_request_missing(self):
        conn = FakeConnection(row=None)

        with patch.object(routes_demo, "get_connection", return_value=conn):
            with self.assertRaises(HTTPException) as context:
                simulate_payment_success({"payment_request_id": "missing"})

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], "PAYMENT_REQUEST_NOT_FOUND")
        self.assertTrue(conn.closed)

    def test_simulate_payment_success_returns_paid_when_already_paid(self):
        conn = FakeConnection(row={
            "kora_reference": "PPAY-123",
            "status": "paid",
            "amount_kobo": 750000,
        })

        with patch.object(routes_demo, "get_connection", return_value=conn):
            response = simulate_payment_success({"payment_request_id": "req_123"})

        self.assertEqual(response["message"], "Payment already confirmed.")
        self.assertEqual(response["status"], "paid")
        self.assertEqual(response["kora_reference"], "PPAY-123")

    def test_simulate_payment_success_is_idempotent_for_processed_event(self):
        conn = FakeConnection(row={
            "kora_reference": "PPAY-123",
            "status": "created",
            "amount_kobo": 750000,
        })

        with (
            patch.object(routes_demo, "get_connection", return_value=conn),
            patch.object(routes_demo, "already_processed", return_value=True),
            patch.object(routes_demo, "save_webhook_event") as save_event,
            patch.object(routes_demo, "mark_payment_paid") as mark_paid,
            patch.object(routes_demo, "mark_webhook_processed") as mark_processed,
        ):
            response = simulate_payment_success({"payment_request_id": "req_123"})

        self.assertEqual(response["message"], "Payment already processed.")
        self.assertEqual(response["status"], "paid")
        save_event.assert_not_called()
        mark_paid.assert_not_called()
        mark_processed.assert_not_called()

    def test_simulate_payment_success_marks_payment_paid(self):
        conn = FakeConnection(row={
            "kora_reference": "PPAY-123",
            "status": "created",
            "amount_kobo": 750000,
        })

        with (
            patch.object(routes_demo, "get_connection", return_value=conn),
            patch.object(routes_demo, "already_processed", return_value=False),
            patch.object(routes_demo, "save_webhook_event") as save_event,
            patch.object(routes_demo, "mark_payment_paid") as mark_paid,
            patch.object(routes_demo, "mark_webhook_processed") as mark_processed,
        ):
            response = simulate_payment_success({"payment_request_id": "req_123"})

        self.assertEqual(response["message"], "Payment simulated successfully. Status updated to paid.")
        self.assertEqual(response["status"], "paid")
        self.assertEqual(response["kora_reference"], "PPAY-123")
        self.assertEqual(response["payment_request_id"], "req_123")
        self.assertIn("DEMO ONLY", response["note"])

        save_webhook_event_args = save_event.call_args.args
        self.assertEqual(save_webhook_event_args[0], "charge.success")
        self.assertEqual(save_webhook_event_args[1], "PPAY-123")
        self.assertTrue(save_webhook_event_args[3])
        self.assertTrue(save_webhook_event_args[2]["data"]["simulated"])
        self.assertEqual(save_webhook_event_args[2]["data"]["amount"], 7500)

        mark_paid.assert_called_once()
        mark_processed.assert_called_once_with("charge.success", "PPAY-123")


if __name__ == "__main__":
    unittest.main()
