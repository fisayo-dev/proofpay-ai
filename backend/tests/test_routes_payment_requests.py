import unittest
from unittest.mock import patch

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


if __name__ == "__main__":
    unittest.main()
