import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from app.services import payment_status_service


class FakeCursor:
    def __init__(self, fetchone_results=None, fetchall_result=None):
        self.queries = []
        self.fetchone_results = list(fetchone_results or [])
        self.fetchall_result = fetchall_result or []

    def execute(self, query, params):
        self.queries.append((query, params))

    def fetchone(self):
        if self.fetchone_results:
            return self.fetchone_results.pop(0)
        return None

    def fetchall(self):
        return self.fetchall_result


class FakeConnection:
    def __init__(self, cursor):
        self.cursor_instance = cursor
        self.closed = False

    def cursor(self):
        return self.cursor_instance

    def close(self):
        self.closed = True


class PaymentStatusServiceTest(unittest.TestCase):
    def test_get_payment_status_returns_request_and_latest_transaction(self):
        created_at = datetime(2026, 5, 20, 12, 0, tzinfo=timezone.utc)
        paid_at = datetime(2026, 5, 20, 12, 5, tzinfo=timezone.utc)
        cursor = FakeCursor(
            fetchone_results=[
                {
                    "id": "req_123",
                    "kora_reference": "PPAY-20260520-DEMO",
                    "status": "created",
                    "amount_kobo": 750099,
                    "currency": "NGN",
                    "item_name": "Black hoodie",
                    "buyer_name": "Daniel",
                    "created_at": created_at,
                },
                {
                    "payment_status": "paid",
                    "webhook_verified": True,
                    "paid_at": paid_at,
                    "payment_method": "card",
                },
            ]
        )
        conn = FakeConnection(cursor)

        with patch.object(payment_status_service, "get_connection", return_value=conn):
            result = payment_status_service.get_payment_status("req_123")

        self.assertEqual(result["payment_request_id"], "req_123")
        self.assertEqual(result["amount"], 7500.99)
        self.assertEqual(result["transaction"]["payment_status"], "paid")
        self.assertTrue(result["transaction"]["webhook_verified"])
        self.assertEqual(result["transaction"]["paid_at"], str(paid_at))
        self.assertTrue(conn.closed)

    def test_get_payment_status_returns_none_when_request_missing(self):
        cursor = FakeCursor(fetchone_results=[None])
        conn = FakeConnection(cursor)

        with patch.object(payment_status_service, "get_connection", return_value=conn):
            result = payment_status_service.get_payment_status("missing")

        self.assertIsNone(result)
        self.assertTrue(conn.closed)

    def test_get_vendor_payment_requests_returns_dashboard_rows(self):
        created_at = datetime(2026, 5, 20, 12, 0, tzinfo=timezone.utc)
        cursor = FakeCursor(
            fetchall_result=[
                {
                    "id": "req_123",
                    "item_name": "Black hoodie",
                    "amount_kobo": 750099,
                    "currency": "NGN",
                    "status": "created",
                    "buyer_name": "Daniel",
                    "public_slug": "ppai_DEMO",
                    "trust_score_at_creation": 57,
                    "trust_verdict": "Caution",
                    "created_at": created_at,
                    "payment_status": "pending",
                    "paid_at": None,
                }
            ]
        )
        conn = FakeConnection(cursor)

        with patch.object(payment_status_service, "get_connection", return_value=conn):
            result = payment_status_service.get_vendor_payment_requests("vendor_123")

        self.assertEqual(result[0]["id"], "req_123")
        self.assertEqual(result[0]["amount"], 7500.99)
        self.assertEqual(result[0]["trust_score"], 57)
        self.assertEqual(result[0]["payment_status"], "pending")
        self.assertIsNone(result[0]["paid_at"])
        self.assertTrue(conn.closed)


if __name__ == "__main__":
    unittest.main()
