import unittest
from unittest.mock import patch

import psycopg
from fastapi import HTTPException

from app.api.v1 import routes_payment_requests


class PublicPaymentRequestRouteTest(unittest.TestCase):
    def test_public_request_includes_trust_reasons_and_rounded_amount(self):
        request = {
            "id": "req_123",
            "vendor_id": "vendor_123",
            "item_name": "Black hoodie",
            "item_description": "Oversized black hoodie, size L",
            "amount_kobo": 750099,
            "currency": "NGN",
            "status": "created",
            "kora_reference": "PPAY-20260520-DEMO",
            "public_slug": "ppai_DEMO",
            "trust_score_at_creation": 72,
            "trust_verdict": "Caution",
        }
        vendor = {
            "business_name": "Favour Fits",
            "category": "fashion",
            "social_handle": "@favourfits",
        }
        trust_check = {
            "reasons": [
                "Vendor profile is fully complete",
                "Vendor has no transaction history yet",
                "No disputes on record",
            ],
            "model_version": "rules-v1",
        }

        with (
            patch.object(routes_payment_requests, "get_payment_request_by_slug", return_value=request),
            patch.object(routes_payment_requests, "get_vendor_by_id", return_value=vendor),
            patch.object(
                routes_payment_requests,
                "get_trust_check_by_payment_request_id",
                return_value=trust_check,
                create=True,
            ),
        ):
            response = routes_payment_requests.get_public_request_endpoint("ppai_DEMO")

        self.assertEqual(response["item"]["amount"], 7500.99)
        self.assertEqual(response["trust"]["score"], 72)
        self.assertEqual(response["trust"]["verdict"], "Caution")
        self.assertEqual(response["trust"]["reasons"], trust_check["reasons"])
        self.assertEqual(response["trust"]["model_version"], "rules-v1")

    def test_refresh_trust_score_requires_vendor_id(self):
        with self.assertRaises(HTTPException) as context:
            routes_payment_requests.refresh_trust_score({"amount_kobo": 750000})

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "VALIDATION_ERROR")

    def test_refresh_trust_score_returns_404_for_missing_vendor(self):
        with patch.object(routes_payment_requests, "get_vendor_for_scoring", return_value=None):
            with self.assertRaises(HTTPException) as context:
                routes_payment_requests.refresh_trust_score({"vendor_id": "missing"})

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], "VENDOR_NOT_FOUND")

    def test_refresh_trust_score_calculates_live_preview(self):
        vendor = {
            "business_name": "Favour Fits",
            "category": "fashion",
            "phone": "+2348012345678",
            "bank_account_name": "FAVOUR ADE",
            "social_handle": "@favourfits",
            "completed_transactions": 14,
            "total_transactions": 15,
            "dispute_count": 0,
        }

        with patch.object(routes_payment_requests, "get_vendor_for_scoring", return_value=vendor):
            response = routes_payment_requests.refresh_trust_score({
                "vendor_id": "vendor_123",
                "amount_kobo": 750000,
                "currency": "NGN",
                "item_name": "Black hoodie",
            })

        self.assertEqual(response["score"], 95)
        self.assertEqual(response["verdict"], "Trusted")
        self.assertEqual(response["model_version"], "rules-v1-anomaly")
        self.assertEqual(response["features"]["amount_naira"], 7500)

    def test_create_request_preserves_database_operational_error(self):
        body = routes_payment_requests.CreatePaymentRequestBody(
            vendor_id="vendor_123",
            item_name="Black hoodie",
            amount_kobo=750000,
        )

        with patch.object(
            routes_payment_requests,
            "create_payment_request",
            side_effect=psycopg.OperationalError("connection timeout"),
        ):
            with self.assertRaises(psycopg.OperationalError):
                routes_payment_requests.create_request_endpoint(body)

    def test_create_request_accepts_amount_naira_and_converts(self):
        body = routes_payment_requests.CreatePaymentRequestBody(
            vendor_id="vendor_123",
            item_name="Black hoodie",
            amount=7500.5,
        )

        captured = {}

        def fake_create(payload):
            captured.update(payload)
            return {"id": "req_123", "amount_kobo": payload["amount_kobo"]}

        with patch.object(routes_payment_requests, "create_payment_request", side_effect=fake_create):
            result = routes_payment_requests.create_request_endpoint(body)

        self.assertIn("amount_kobo", captured)
        self.assertEqual(captured["amount_kobo"], 750050)

    def test_refresh_trust_score_preserves_database_operational_error(self):
        with patch.object(
            routes_payment_requests,
            "get_vendor_for_scoring",
            side_effect=psycopg.OperationalError("connection timeout"),
        ):
            with self.assertRaises(psycopg.OperationalError):
                routes_payment_requests.refresh_trust_score({"vendor_id": "vendor_123"})


if __name__ == "__main__":
    unittest.main()
