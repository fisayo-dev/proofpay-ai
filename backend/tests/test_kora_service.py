import json
import unittest
from unittest.mock import patch

from app.services import kora_service


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return json.dumps(self.payload).encode("utf-8")


class KoraServiceTest(unittest.TestCase):
    def test_verify_kora_charge_returns_charge_data(self):
        payload = {
            "status": True,
            "data": {
                "reference": "PPAY-123",
                "status": "success",
                "amount": "7500.00",
                "currency": "NGN",
            },
        }

        with (
            patch.object(kora_service.settings, "kora_secret_key", "secret"),
            patch.object(kora_service.request, "urlopen", return_value=FakeResponse(payload)) as urlopen,
        ):
            result = kora_service.verify_kora_charge("PPAY-123")

        self.assertEqual(result["reference"], "PPAY-123")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["amount"], 7500.0)
        self.assertEqual(result["currency"], "NGN")
        self.assertEqual(urlopen.call_args.args[0].headers["Authorization"], "Bearer secret")

    def test_verify_kora_charge_rejects_missing_secret(self):
        with patch.object(kora_service.settings, "kora_secret_key", ""):
            with self.assertRaises(kora_service.KoraVerificationError):
                kora_service.verify_kora_charge("PPAY-123")


if __name__ == "__main__":
    unittest.main()
