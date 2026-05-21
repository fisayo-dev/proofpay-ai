import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.api.v1 import routes_payments


class PaymentsRouteTest(unittest.TestCase):
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
