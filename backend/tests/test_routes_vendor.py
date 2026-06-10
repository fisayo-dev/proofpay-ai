import unittest
import json
from decimal import Decimal
from unittest.mock import patch

import psycopg

from app.api.v1 import routes_vendor


class VendorRouteTest(unittest.TestCase):
    def test_signup_buyer_returns_buyer_session(self):
        body = routes_vendor.SignupRequest(
            role="buyer",
            full_name="Daniel Buyer",
            email="daniel@example.com",
            password="StrongPass123!",
            business_name="",
            category="",
        )
        account = {
            "user_id": "user_123",
            "vendor_id": None,
            "role": "buyer",
            "full_name": "Daniel Buyer",
            "email": "daniel@example.com",
            "business_name": "",
            "trust_score": None,
            "created_at": "2026-06-10T08:00:00+00:00",
        }

        with (
            patch.object(routes_vendor, "create_account", return_value=account),
            patch.object(routes_vendor, "create_session_token", return_value="signed-token"),
        ):
            response = routes_vendor.signup_endpoint(body)

        payload = json.loads(response.body)
        self.assertEqual(payload["role"], "buyer")
        self.assertIsNone(payload["vendor_id"])
        self.assertIn("proofpay_session=signed-token", response.headers["set-cookie"])

    def test_login_returns_role_aware_session(self):
        body = routes_vendor.LoginRequest(
            email="vendor@example.com",
            password="StrongPass123!",
        )
        account = {
            "user_id": "user_123",
            "vendor_id": "vendor_123",
            "role": "vendor",
            "full_name": "Favour Ade",
            "email": "vendor@example.com",
            "business_name": "Favour Fits",
            "trust_score": 82,
            "created_at": "2026-06-10T08:00:00+00:00",
        }

        with (
            patch.object(routes_vendor, "login_account", return_value=account),
            patch.object(routes_vendor, "create_session_token", return_value="signed-token"),
        ):
            response = routes_vendor.login_endpoint(body)

        payload = json.loads(response.body)
        self.assertEqual(payload["role"], "vendor")
        self.assertEqual(payload["vendor_id"], "vendor_123")

    def test_login_rejects_invalid_credentials(self):
        body = routes_vendor.LoginRequest(email="bad@example.com", password="wrong")

        with patch.object(
            routes_vendor,
            "login_account",
            side_effect=routes_vendor.InvalidLoginError("Invalid email or password."),
        ):
            with self.assertRaises(routes_vendor.HTTPException) as context:
                routes_vendor.login_endpoint(body)

        self.assertEqual(context.exception.status_code, 401)

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
            "trust_score": Decimal("50"),
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

    def test_create_vendor_sets_cross_site_cookie_attrs_in_production(self):
        body = routes_vendor.CreateVendorRequest(
            full_name="Favour Ade",
            email="favour@example.com",
            password="StrongPass123!",
            business_name="Favour Fits",
            category="fashion",
        )
        vendor = {
            "id": "vendor_123",
            "user_id": "user_123",
            "full_name": "Favour Ade",
            "email": "favour@example.com",
            "business_name": "Favour Fits",
            "trust_score": Decimal("50"),
            "created_at": "2026-05-22T08:00:00+00:00",
        }

        with (
            patch.object(routes_vendor, "create_vendor", return_value=vendor),
            patch.object(routes_vendor, "create_session_token", return_value="signed-token"),
            patch.object(routes_vendor.settings, "env", "production"),
        ):
            response = routes_vendor.create_vendor_endpoint(body)

        set_cookie = response.headers["set-cookie"]
        self.assertIn("secure", set_cookie.lower())
        self.assertIn("samesite=none", set_cookie.lower())

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

    def test_create_vendor_returns_conflict_for_existing_email(self):
        body = routes_vendor.CreateVendorRequest(
            full_name="Favour Ade",
            email="favour@example.com",
            password="StrongPass123!",
            business_name="Favour Fits",
            category="fashion",
        )

        with patch.object(
            routes_vendor,
            "create_vendor",
            side_effect=routes_vendor.VendorAlreadyExistsError(
                "A user with this email already exists."
            ),
        ):
            with self.assertRaises(routes_vendor.HTTPException) as context:
                routes_vendor.create_vendor_endpoint(body)

        self.assertEqual(context.exception.status_code, 409)
        self.assertEqual(context.exception.detail["code"], "USER_ALREADY_EXISTS")
        self.assertEqual(
            context.exception.detail["message"],
            "A user with this email already exists.",
        )

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
