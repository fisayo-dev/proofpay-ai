import unittest
import json
from unittest.mock import patch

import psycopg

from app.api.v1 import routes_vendor


class VendorRouteTest(unittest.TestCase):
    def test_create_vendor_sets_httponly_cookie_without_token_body(self):
        body = routes_vendor.CreateVendorRequest(
            full_name="Favour Ade",
            email="favour@example.com",
            password="StrongPass123!",
            business_name="Favour Fits",
            category="fashion",
            phone="+2348012345678",
            social_handle="@favourfits",
            bank_account_name="FAVOUR ADE",
        )
        vendor = {
            "id": "vendor_123",
            "user_id": "user_123",
            "full_name": "Favour Ade",
            "email": "favour@example.com",
            "business_name": "Favour Fits",
            "trust_score": 50,
            "created_at": "2026-05-22T08:00:00+00:00",
        }

        with (
            patch.object(routes_vendor, "create_vendor", return_value=vendor),
            patch.object(routes_vendor, "create_session_token", return_value="signed-token"),
        ):
            response = routes_vendor.create_vendor_endpoint(body)

        payload = json.loads(response.body)
        self.assertEqual(payload["vendor_id"], "vendor_123")
        self.assertEqual(payload["full_name"], "Favour Ade")
        self.assertEqual(payload["email"], "favour@example.com")
        self.assertNotIn("access_token", payload)

        set_cookie = response.headers["set-cookie"]
        self.assertIn("proofpay_session=signed-token", set_cookie)
        self.assertIn("HttpOnly", set_cookie)

    def test_create_vendor_preserves_database_operational_error(self):
        body = routes_vendor.CreateVendorRequest(
            business_name="Favour Fits",
            category="fashion",
        )

        with patch.object(
            routes_vendor,
            "create_vendor",
            side_effect=psycopg.OperationalError("connection timeout"),
        ):
            with self.assertRaises(psycopg.OperationalError):
                routes_vendor.create_vendor_endpoint(body)

    def test_get_vendor_preserves_database_operational_error(self):
        with patch.object(
            routes_vendor,
            "get_vendor_by_id",
            side_effect=psycopg.OperationalError("connection timeout"),
        ):
            with self.assertRaises(psycopg.OperationalError):
                routes_vendor.get_vendor_endpoint("vendor_123")


if __name__ == "__main__":
    unittest.main()
