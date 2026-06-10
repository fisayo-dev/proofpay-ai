import unittest
from unittest.mock import patch

from app.services import vendor_service


class FakeCursor:
    def __init__(self, rows):
        self.rows = list(rows)
        self.queries = []

    def execute(self, query, params):
        self.queries.append((query, params))

    def fetchone(self):
        return self.rows.pop(0)


class FakeConnection:
    def __init__(self, cursor):
        self.cursor_instance = cursor
        self.committed = False
        self.rolled_back = False
        self.closed = False

    def cursor(self):
        return self.cursor_instance

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


class VendorServiceTest(unittest.TestCase):
    def test_create_vendor_with_signup_fields_creates_user_and_links_vendor(self):
        user_row = {
            "id": "user_123",
            "full_name": "Favour Ade",
            "email": "favour@example.com",
        }
        vendor_row = {
            "id": "vendor_123",
            "user_id": "user_123",
            "business_name": "Favour Fits",
            "trust_score": 50,
            "created_at": "now",
        }
        cursor = FakeCursor([user_row, vendor_row])
        conn = FakeConnection(cursor)

        with patch.object(vendor_service, "get_connection", return_value=conn):
            result = vendor_service.create_vendor({
                "full_name": "Favour Ade",
                "email": "favour@example.com",
                "password": "StrongPass123!",
                "business_name": "Favour Fits",
                "category": "fashion",
                "phone": "+2348012345678",
                "social_handle": "@favourfits",
                "bank_account_name": "FAVOUR ADE",
            })

        self.assertEqual(result["user_id"], "user_123")
        self.assertEqual(result["full_name"], "Favour Ade")
        self.assertEqual(result["email"], "favour@example.com")
        self.assertEqual(result["business_name"], "Favour Fits")
        self.assertIn("INSERT INTO users", cursor.queries[0][0])
        self.assertIn("user_id, business_name", cursor.queries[1][0])
        self.assertTrue(conn.committed)
        self.assertTrue(conn.closed)

    def test_create_vendor_raises_domain_error_for_duplicate_email(self):
        class DuplicateEmailCursor(FakeCursor):
            def execute(self, query, params):
                self.queries.append((query, params))
                if "INSERT INTO users" in query:
                    raise vendor_service.psycopg.errors.UniqueViolation(
                        "duplicate key value violates unique constraint"
                    )

        cursor = DuplicateEmailCursor([])
        conn = FakeConnection(cursor)

        with patch.object(vendor_service, "get_connection", return_value=conn):
            with self.assertRaises(vendor_service.VendorAlreadyExistsError):
                vendor_service.create_vendor({
                    "full_name": "Favour Ade",
                    "email": "favour@example.com",
                    "password": "StrongPass123!",
                    "business_name": "Favour Fits",
                    "category": "fashion",
                })

        self.assertFalse(conn.committed)
        self.assertTrue(conn.rolled_back)
        self.assertTrue(conn.closed)

    def test_get_vendor_score_prediction_recalculates_with_successful_transaction(self):
        vendor = {
            "vendor_id": "vendor_123",
            "business_name": "Favour Fits",
            "category": "fashion",
            "phone": "+2348012345678",
            "bank_account_name": "FAVOUR ADE",
            "social_handle": "@favourfits",
            "completed_transactions": 3,
            "total_transactions": 4,
            "dispute_count": 0,
        }
        scored_vendors = []

        def fake_score(scoring_vendor, payment_request):
            scored_vendors.append(scoring_vendor)
            return {
                "score": 72 if scoring_vendor["completed_transactions"] == 3 else 79,
            }

        with (
            patch.object(vendor_service, "get_vendor_for_scoring", return_value=vendor),
            patch.object(vendor_service, "calculate_trust_score", side_effect=fake_score),
            patch.object(vendor_service, "typical_amount_kobo_for_category", return_value=4050000),
        ):
            result = vendor_service.get_vendor_score_prediction("vendor_123")

        self.assertEqual(result["current_score"], 72)
        self.assertEqual(result["predicted_score_if_paid"], 79)
        self.assertEqual(scored_vendors[1]["completed_transactions"], 4)
        self.assertEqual(scored_vendors[1]["total_transactions"], 5)
        self.assertEqual(
            result["message"],
            "Complete this transaction to raise your trust score from 72 to 79",
        )

    def test_get_vendor_score_prediction_returns_none_when_vendor_missing(self):
        with patch.object(vendor_service, "get_vendor_for_scoring", return_value=None):
            result = vendor_service.get_vendor_score_prediction("missing")

        self.assertIsNone(result)

    def test_get_vendor_analytics_returns_normalized_metrics(self):
        row = {
            "total_requests": 10,
            "paid_count": 7,
            "failed_count": 1,
            "pending_count": 2,
            "dispute_count": 1,
            "average_amount_kobo": 550000,
            "average_time_to_payment_seconds": 120.456,
        }
        cursor = FakeCursor([row])
        conn = FakeConnection(cursor)

        with (
            patch.object(vendor_service, "get_vendor_by_id", return_value={"id": "vendor_123"}),
            patch.object(vendor_service, "get_connection", return_value=conn),
        ):
            result = vendor_service.get_vendor_analytics("vendor_123")

        self.assertIn("WITH vendor_requests", cursor.queries[0][0])
        self.assertEqual(cursor.queries[0][1], ("vendor_123",))
        self.assertEqual(result["total_requests"], 10)
        self.assertEqual(result["paid_count"], 7)
        self.assertEqual(result["failed_count"], 1)
        self.assertEqual(result["pending_count"], 2)
        self.assertEqual(result["dispute_count"], 1)
        self.assertEqual(result["completion_rate"], 0.7)
        self.assertEqual(result["average_amount_naira"], 5500.0)
        self.assertEqual(result["average_time_to_payment_seconds"], 120.46)
        self.assertTrue(conn.closed)

    def test_get_vendor_analytics_returns_empty_metrics(self):
        row = {
            "total_requests": 0,
            "paid_count": 0,
            "failed_count": 0,
            "pending_count": 0,
            "dispute_count": 0,
            "average_amount_kobo": None,
            "average_time_to_payment_seconds": None,
        }
        cursor = FakeCursor([row])
        conn = FakeConnection(cursor)

        with (
            patch.object(vendor_service, "get_vendor_by_id", return_value={"id": "vendor_123"}),
            patch.object(vendor_service, "get_connection", return_value=conn),
        ):
            result = vendor_service.get_vendor_analytics("vendor_123")

        self.assertEqual(result["completion_rate"], 0.0)
        self.assertEqual(result["average_amount_naira"], 0.0)
        self.assertIsNone(result["average_time_to_payment_seconds"])

    def test_get_vendor_analytics_returns_none_when_vendor_missing(self):
        with patch.object(vendor_service, "get_vendor_by_id", return_value=None):
            result = vendor_service.get_vendor_analytics("missing")

        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
