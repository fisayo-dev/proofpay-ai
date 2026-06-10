import unittest
import json
from decimal import Decimal
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

    def test_score_prediction_endpoint_returns_prediction(self):
        prediction = {
            "current_score": 72,
            "predicted_score_if_paid": 79,
            "message": "Complete this transaction to raise your trust score from 72 to 79",
        }

        with patch.object(
            routes_vendor,
            "get_vendor_score_prediction",
            return_value=prediction,
        ):
            result = routes_vendor.get_vendor_score_prediction_endpoint("vendor_123")

        self.assertEqual(result, prediction)

    def test_score_prediction_endpoint_returns_404_when_vendor_missing(self):
        with patch.object(routes_vendor, "get_vendor_score_prediction", return_value=None):
            with self.assertRaises(routes_vendor.HTTPException) as context:
                routes_vendor.get_vendor_score_prediction_endpoint("missing")

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], "VENDOR_NOT_FOUND")

    def test_analytics_endpoint_returns_metrics(self):
        analytics = {
            "vendor_id": "vendor_123",
            "total_requests": 10,
            "paid_count": 7,
            "failed_count": 1,
            "pending_count": 2,
            "dispute_count": 1,
            "completion_rate": 0.7,
            "average_amount_naira": 5500.0,
            "average_time_to_payment_seconds": 120.0,
        }

        with patch.object(routes_vendor, "get_vendor_analytics", return_value=analytics):
            result = routes_vendor.get_vendor_analytics_endpoint("vendor_123")

        self.assertEqual(result, analytics)

    def test_analytics_endpoint_returns_404_when_vendor_missing(self):
        with patch.object(routes_vendor, "get_vendor_analytics", return_value=None):
            with self.assertRaises(routes_vendor.HTTPException) as context:
                routes_vendor.get_vendor_analytics_endpoint("missing")

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], "VENDOR_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
