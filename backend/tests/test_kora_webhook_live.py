import json
import os
import hmac
import hashlib
from collections import OrderedDict
from urllib import error, request
import unittest

LIVE_WEBHOOK_URL = "https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/payments/kora/webhook"
LIVE_BASE_URL = "https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1"
DEFAULT_REFERENCE = "PPAY-20260525-JYXB7GDO"


class LiveKoraWebhookIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.run_live = os.getenv("RUN_LIVE_KORA_WEBHOOK_TEST") == "1"
        self.secret_key = os.getenv("KORA_SECRET_KEY", "")
        if self.run_live and not self.secret_key:
            self.fail("KORA_SECRET_KEY must be set when RUN_LIVE_KORA_WEBHOOK_TEST=1")

    def _build_payload(self, reference: str, amount: int = 7500, currency: str = "NGN") -> OrderedDict:
        return OrderedDict(
            [
                ("event", "charge.success"),
                (
                    "data",
                    OrderedDict(
                        [
                            ("amount", amount),
                            ("status", "success"),
                            ("currency", currency),
                            ("reference", reference),
                            ("payment_reference", reference),
                            ("payment_method", "card"),
                        ]
                    ),
                ),
            ]
        )

    def _canonical_json(self, payload: OrderedDict) -> str:
        return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)

    def _sign(self, payload: OrderedDict) -> str:
        message = self._canonical_json(payload)
        return hmac.new(
            self.secret_key.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _post_json(self, url: str, payload: OrderedDict, signature: str) -> tuple[int, dict]:
        body = self._canonical_json(payload).encode("utf-8")
        req = request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "x-korapay-signature": signature,
            },
        )
        try:
            with request.urlopen(req, timeout=30) as response:
                raw = response.read().decode("utf-8")
                return response.status, json.loads(raw)
        except error.HTTPError as exc:
            raw = exc.read().decode("utf-8")
            return exc.code, json.loads(raw) if raw else {}

    def _get_json(self, url: str) -> dict:
        req = request.Request(url, method="GET")
        with request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))

    @unittest.skipUnless(os.getenv("RUN_LIVE_KORA_WEBHOOK_TEST") == "1", "live webhook test disabled")
    def test_signed_webhook_updates_status_and_rejects_duplicate(self):
        seed = self._post_json(f"{LIVE_BASE_URL}/demo/seed", OrderedDict(), "")
        payment_request_id = seed[1].get("payment_request_id") if isinstance(seed, tuple) else seed.get("payment_request_id")
        reference = seed[1].get("kora_reference") if isinstance(seed, tuple) else seed.get("kora_reference")

        payload = self._build_payload(reference)
        signature = self._sign(payload)

        first_status, first_response = self._post_json(LIVE_WEBHOOK_URL, payload, signature)
        self.assertEqual(first_status, 200)
        self.assertTrue(first_response["received"])
        self.assertFalse(first_response["duplicate"])
        self.assertTrue(first_response["signature_valid"])
        self.assertEqual(first_response["kora_reference"], reference)

        status = self._get_json(f"{LIVE_BASE_URL}/payments/{payment_request_id}/status")
        self.assertEqual(status["status"], "paid")
        self.assertEqual(status["transaction"]["payment_status"], "paid")
        self.assertTrue(status["transaction"]["webhook_verified"])

        second_status, second_response = self._post_json(LIVE_WEBHOOK_URL, payload, signature)
        self.assertEqual(second_status, 200)
        self.assertTrue(second_response["received"])
        self.assertTrue(second_response["duplicate"])
        self.assertTrue(second_response["signature_valid"])


if __name__ == "__main__":
    unittest.main()
