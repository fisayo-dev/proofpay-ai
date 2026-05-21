import unittest
from unittest.mock import patch

from app.services import webhook_service


class FakeCursor:
    def __init__(self, fetchone_result=None):
        self.queries = []
        self.fetchone_result = fetchone_result

    def execute(self, query, params):
        self.queries.append((query, params))

    def fetchone(self):
        return self.fetchone_result


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


class WebhookServiceTest(unittest.TestCase):
    def test_save_webhook_event_inserts_payload_once(self):
        cursor = FakeCursor()
        conn = FakeConnection(cursor)
        payload = {"event": "charge.success", "data": {"reference": "PPAY-123"}}

        with patch.object(webhook_service, "get_connection", return_value=conn):
            webhook_service.save_webhook_event("charge.success", "PPAY-123", payload, True)

        query, params = cursor.queries[0]
        self.assertIn("ON CONFLICT", query)
        self.assertEqual(params[0], "charge.success")
        self.assertEqual(params[1], "PPAY-123")
        self.assertIn('"reference": "PPAY-123"', params[2])
        self.assertTrue(params[3])
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)

    def test_already_processed_returns_false_when_event_missing(self):
        cursor = FakeCursor(fetchone_result=None)
        conn = FakeConnection(cursor)

        with patch.object(webhook_service, "get_connection", return_value=conn):
            result = webhook_service.already_processed("charge.success", "PPAY-123")

        self.assertFalse(result)
        self.assertTrue(conn.closed)

    def test_already_processed_returns_processed_flag(self):
        cursor = FakeCursor(fetchone_result={"processed": True})
        conn = FakeConnection(cursor)

        with patch.object(webhook_service, "get_connection", return_value=conn):
            result = webhook_service.already_processed("charge.success", "PPAY-123")

        self.assertTrue(result)
        self.assertTrue(conn.closed)

    def test_mark_webhook_processed_updates_processed_flag(self):
        cursor = FakeCursor()
        conn = FakeConnection(cursor)

        with patch.object(webhook_service, "get_connection", return_value=conn):
            webhook_service.mark_webhook_processed("charge.success", "PPAY-123")

        query, params = cursor.queries[0]
        self.assertIn("processed = true", query)
        self.assertEqual(params, ("charge.success", "PPAY-123"))
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)

    def test_mark_payment_paid_updates_request_and_transaction(self):
        cursor = FakeCursor()
        conn = FakeConnection(cursor)

        with patch.object(webhook_service, "get_connection", return_value=conn):
            webhook_service.mark_payment_paid("PPAY-123", {"status": "success"})

        self.assertEqual(len(cursor.queries), 2)
        self.assertIn("SET status = 'paid'", cursor.queries[0][0])
        self.assertIn("payment_status = 'paid'", cursor.queries[1][0])
        self.assertEqual(cursor.queries[0][1][1], "PPAY-123")
        self.assertEqual(cursor.queries[1][1][2], "PPAY-123")
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)

    def test_mark_payment_failed_does_not_override_paid_or_delivered(self):
        cursor = FakeCursor()
        conn = FakeConnection(cursor)

        with patch.object(webhook_service, "get_connection", return_value=conn):
            webhook_service.mark_payment_failed("PPAY-123", {"status": "failed"})

        self.assertEqual(len(cursor.queries), 2)
        self.assertIn("status NOT IN ('paid', 'delivered')", cursor.queries[0][0])
        self.assertIn("payment_status NOT IN ('paid')", cursor.queries[1][0])
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)


if __name__ == "__main__":
    unittest.main()
