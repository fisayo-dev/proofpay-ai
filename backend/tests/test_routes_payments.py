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

    def test_verify_kora_checkout_endpoint_verifies_with_kora_then_marks_payment_paid(self):
        request = {
            "id": "req_123",
            "kora_reference": "PPAY-20260520-DEMO",
            "amount_kobo": 750000,
            "currency": "NGN",
        }
        body = routes_payments.VerifyKoraCheckoutBody(
            kora_reference="PPAY-20260520-DEMO",
        )
        verification = {
            "status": "success",
            "reference": "PPAY-20260520-DEMO",
            "amount": 7500.0,
            "currency": "NGN",
        }

        with (
            patch.object(routes_payments, "get_payment_request_by_id", return_value=request),
            patch.object(routes_payments, "verify_kora_charge", return_value=verification) as verify_charge,
            patch.object(routes_payments, "mark_payment_paid_from_checkout_callback") as mark_paid,
        ):
            result = routes_payments.verify_kora_checkout_endpoint("req_123", body)

        verify_charge.assert_called_once_with("PPAY-20260520-DEMO")
        mark_paid.assert_called_once_with("PPAY-20260520-DEMO")
        self.assertEqual(result["payment_request_id"], "req_123")
        self.assertEqual(result["kora_reference"], "PPAY-20260520-DEMO")
        self.assertEqual(result["status"], "paid")
        self.assertEqual(result["source"], "kora_charge_verify")

    def test_verify_kora_checkout_endpoint_rejects_unsuccessful_kora_charge(self):
        request = {
            "id": "req_123",
            "kora_reference": "PPAY-20260520-DEMO",
            "amount_kobo": 750000,
            "currency": "NGN",
        }
        body = routes_payments.VerifyKoraCheckoutBody(
            kora_reference="PPAY-20260520-DEMO",
        )

        with (
            patch.object(routes_payments, "get_payment_request_by_id", return_value=request),
            patch.object(
                routes_payments,
                "verify_kora_charge",
                return_value={
                    "status": "pending",
                    "reference": "PPAY-20260520-DEMO",
                    "amount": 7500.0,
                    "currency": "NGN",
                },
            ),
            patch.object(routes_payments, "mark_payment_paid_from_checkout_callback") as mark_paid,
        ):
            with self.assertRaises(HTTPException) as context:
                routes_payments.verify_kora_checkout_endpoint("req_123", body)

        mark_paid.assert_not_called()
        self.assertEqual(context.exception.status_code, 409)
        self.assertEqual(context.exception.detail["code"], "KORA_CHARGE_NOT_SUCCESSFUL")

    def test_verify_kora_checkout_endpoint_rejects_amount_mismatch(self):
        request = {
            "id": "req_123",
            "kora_reference": "PPAY-20260520-DEMO",
            "amount_kobo": 750000,
            "currency": "NGN",
        }
        body = routes_payments.VerifyKoraCheckoutBody(
            kora_reference="PPAY-20260520-DEMO",
        )

        with (
            patch.object(routes_payments, "get_payment_request_by_id", return_value=request),
            patch.object(
                routes_payments,
                "verify_kora_charge",
                return_value={
                    "status": "success",
                    "reference": "PPAY-20260520-DEMO",
                    "amount": 7400.0,
                    "currency": "NGN",
                },
            ),
            patch.object(routes_payments, "mark_payment_paid_from_checkout_callback") as mark_paid,
        ):
            with self.assertRaises(HTTPException) as context:
                routes_payments.verify_kora_checkout_endpoint("req_123", body)

        mark_paid.assert_not_called()
        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "KORA_CHARGE_MISMATCH")

    def test_verify_kora_checkout_endpoint_raises_404_when_missing(self):
        body = routes_payments.VerifyKoraCheckoutBody(
            kora_reference="PPAY-20260520-DEMO",
        )

        with patch.object(routes_payments, "get_payment_request_by_id", return_value=None):
            with self.assertRaises(HTTPException) as context:
                routes_payments.verify_kora_checkout_endpoint("missing", body)

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], "PAYMENT_REQUEST_NOT_FOUND")

    def test_verify_kora_checkout_endpoint_rejects_reference_mismatch(self):
        request = {
            "id": "req_123",
            "kora_reference": "PPAY-20260520-DEMO",
        }
        body = routes_payments.VerifyKoraCheckoutBody(
            kora_reference="PPAY-20260520-WRONG",
        )

        with (
            patch.object(routes_payments, "get_payment_request_by_id", return_value=request),
            patch.object(routes_payments, "mark_payment_paid_from_checkout_callback") as mark_paid,
        ):
            with self.assertRaises(HTTPException) as context:
                routes_payments.verify_kora_checkout_endpoint("req_123", body)

        mark_paid.assert_not_called()
        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "KORA_REFERENCE_MISMATCH")

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
