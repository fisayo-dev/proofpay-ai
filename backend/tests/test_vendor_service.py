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
        self.assertTrue(any("INSERT INTO users" in query for query, _ in cursor.queries))
        self.assertTrue(any("user_id, business_name" in query for query, _ in cursor.queries))
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


if __name__ == "__main__":
    unittest.main()
