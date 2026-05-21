import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.api.v1 import routes_disputes


class FakeCursor:
    def __init__(self, fetchone_results=None):
        self.queries = []
        self.fetchone_results = list(fetchone_results or [])

    def execute(self, query, params):
        self.queries.append((query, params))

    def fetchone(self):
        if self.fetchone_results:
            return self.fetchone_results.pop(0)
        return None


class FakeConnection:
    def __init__(self, cursor):
        self.cursor_instance = cursor
        self.committed = False
        self.closed = False

    def cursor(self):
        return self.cursor_instance

    def commit(self):
        self.committed = True

    def close(self):
        self.closed = True


class DisputesRouteTest(unittest.TestCase):
    def test_confirm_delivery_updates_paid_request(self):
        cursor = FakeCursor(fetchone_results=[{"id": "req_123"}])
        conn = FakeConnection(cursor)
        body = routes_disputes.ConfirmDeliveryBody(payment_request_id="req_123")

        with patch.object(routes_disputes, "get_connection", return_value=conn):
            result = routes_disputes.confirm_delivery(body)

        self.assertEqual(result, {"status": "delivered", "payment_request_id": "req_123"})
        self.assertIn("status = 'delivered'", cursor.queries[0][0])
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)

    def test_confirm_delivery_rejects_unpaid_request(self):
        cursor = FakeCursor(fetchone_results=[None])
        conn = FakeConnection(cursor)
        body = routes_disputes.ConfirmDeliveryBody(payment_request_id="req_123")

        with patch.object(routes_disputes, "get_connection", return_value=conn):
            with self.assertRaises(HTTPException) as context:
                routes_disputes.confirm_delivery(body)

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "INVALID_STATE")
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)

    def test_create_dispute_updates_paid_request(self):
        cursor = FakeCursor(fetchone_results=[{"id": "req_123", "status": "paid"}])
        conn = FakeConnection(cursor)
        body = routes_disputes.CreateDisputeBody(
            payment_request_id="req_123",
            reason="Item was not delivered",
        )

        with patch.object(routes_disputes, "get_connection", return_value=conn):
            result = routes_disputes.create_dispute(body)

        self.assertEqual(result["status"], "disputed")
        self.assertEqual(result["payment_request_id"], "req_123")
        self.assertIn("dispute_id", result)
        self.assertEqual(len(cursor.queries), 3)
        self.assertIn("INSERT INTO disputes", cursor.queries[1][0])
        self.assertIn("status = 'disputed'", cursor.queries[2][0])
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)

    def test_create_dispute_raises_404_when_request_missing(self):
        cursor = FakeCursor(fetchone_results=[None])
        conn = FakeConnection(cursor)
        body = routes_disputes.CreateDisputeBody(
            payment_request_id="missing",
            reason="Item was not delivered",
        )

        with patch.object(routes_disputes, "get_connection", return_value=conn):
            with self.assertRaises(HTTPException) as context:
                routes_disputes.create_dispute(body)

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], "PAYMENT_REQUEST_NOT_FOUND")
        self.assertTrue(conn.closed)

    def test_create_dispute_rejects_unpaid_request(self):
        cursor = FakeCursor(fetchone_results=[{"id": "req_123", "status": "created"}])
        conn = FakeConnection(cursor)
        body = routes_disputes.CreateDisputeBody(
            payment_request_id="req_123",
            reason="Item was not delivered",
        )

        with patch.object(routes_disputes, "get_connection", return_value=conn):
            with self.assertRaises(HTTPException) as context:
                routes_disputes.create_dispute(body)

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "INVALID_STATE")
        self.assertTrue(conn.closed)


if __name__ == "__main__":
    unittest.main()
