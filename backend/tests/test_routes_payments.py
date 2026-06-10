import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.api.v1 import routes_payments


class PaymentsRouteTest(unittest.TestCase):
    def test_payments_router_registers_kora_webhook_post(self):
        webhook_routes = [
            route
            for route in routes_payments.router.routes
            if getattr(route, "path", "").endswith("/payments/kora/webhook")
        ]

        self.assertTrue(
            any("POST" in getattr(route, "methods", set()) for route in webhook_routes)
        )

    def test_payment_status_endpoint_returns_status(self):
        status = {
            "payment_request_id": "req_123",
            "kora_reference": "PPAY-20260520-DEMO",
            "status": "created",
            "amount": 7500.0,
            "transaction": {"payment_status": "pending"},
        }

        with patch.object(routes_payments, "get_payment_status", return_value=status):
            result = routes_payments.get_payment_status_endpoint("req_123")

        self.assertEqual(result, status)

    def test_payment_status_endpoint_raises_404_when_missing(self):
        with patch.object(routes_payments, "get_payment_status", return_value=None):
            with self.assertRaises(HTTPException) as context:
                routes_payments.get_payment_status_endpoint("missing")

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], "PAYMENT_REQUEST_NOT_FOUND")

    def test_kora_checkout_config_endpoint_returns_checkout_payload(self):
        request = {
            "id": "req_123",
            "kora_reference": "PPAY-20260520-DEMO",
            "amount_kobo": 750000,
            "currency": "NGN",
            "buyer_name": "Daniel",
            "buyer_email": "daniel@example.com",
        }

        with (
            patch.object(routes_payments, "get_payment_request_by_id", return_value=request),
            patch.object(routes_payments.settings, "kora_public_key", "pk_test_demo"),
            patch.object(routes_payments.settings, "kora_webhook_url", "https://example.com/webhook"),
        ):
            result = routes_payments.get_kora_checkout_config_endpoint("req_123")

        self.assertEqual(result["payment_request_id"], "req_123")
        self.assertEqual(result["kora_reference"], "PPAY-20260520-DEMO")
        self.assertEqual(result["checkout_config"]["key"], "pk_test_demo")
        self.assertEqual(result["checkout_config"]["reference"], "PPAY-20260520-DEMO")
        self.assertEqual(result["checkout_config"]["amount"], 7500.0)
        self.assertEqual(result["checkout_config"]["notification_url"], "https://example.com/webhook")

    def test_kora_checkout_config_endpoint_raises_404_when_missing(self):
        with patch.object(routes_payments, "get_payment_request_by_id", return_value=None):
            with self.assertRaises(HTTPException) as context:
                routes_payments.get_kora_checkout_config_endpoint("missing")

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], "PAYMENT_REQUEST_NOT_FOUND")

    def test_vendor_requests_endpoint_returns_dashboard_payload(self):
        requests = [
            {
                "id": "req_123",
                "item_name": "Black hoodie",
                "amount": 7500.0,
                "payment_status": "pending",
            }
        ]

        with patch.object(routes_payments, "get_vendor_payment_requests", return_value=requests):
            result = routes_payments.get_vendor_requests_endpoint("vendor_123")

        self.assertEqual(result["vendor_id"], "vendor_123")
        self.assertEqual(result["total"], 1)
        self.assertEqual(result["requests"], requests)


if __name__ == "__main__":
    unittest.main()
