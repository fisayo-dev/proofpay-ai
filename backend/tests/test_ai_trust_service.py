import json
import unittest
from unittest.mock import patch
import urllib.error

from app.services import ai_trust_service


class FakeResponse:
    def __init__(self, body: dict):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self):
        return json.dumps(self.body).encode("utf-8")


class AITrustServiceTest(unittest.TestCase):
    def test_generate_ai_trust_explanation_returns_fallback_without_key(self):
        with patch.object(ai_trust_service.settings, "groq_api_key", ""):
            result = ai_trust_service.generate_ai_trust_explanation(
                {"business_name": "Favour Fits"},
                {"amount_kobo": 750000},
                {"score": 95, "verdict": "Trusted", "reasons": ["No disputes on record"]},
            )

        self.assertFalse(result["ai_powered"])
        self.assertEqual(result["engine"], "rules-fallback")
        self.assertIn("Favour Fits", result["summary"])
        self.assertIn("Trusted", result["summary"])

    def test_generate_ai_trust_explanation_calls_groq_when_key_exists(self):
        groq_body = {
            "choices": [
                {
                    "message": {
                        "content": "Favour Fits looks low risk based on completed transactions and no disputes."
                    }
                }
            ]
        }

        with (
            patch.object(ai_trust_service.settings, "groq_api_key", "test-key"),
            patch.object(ai_trust_service.settings, "groq_model", "llama-test"),
            patch.object(ai_trust_service.urllib.request, "urlopen", return_value=FakeResponse(groq_body)) as urlopen,
        ):
            result = ai_trust_service.generate_ai_trust_explanation(
                {"business_name": "Favour Fits", "completed_transactions": 14},
                {"item_name": "Black hoodie", "amount_kobo": 750000},
                {"score": 95, "verdict": "Trusted", "reasons": ["No disputes on record"]},
            )

        self.assertTrue(result["ai_powered"])
        self.assertEqual(result["engine"], "groq-chat-completions")
        self.assertEqual(result["model"], "llama-test")
        self.assertIn("low risk", result["summary"])
        self.assertTrue(urlopen.called)

    def test_generate_ai_trust_explanation_strips_quoted_key(self):
        groq_body = {
            "choices": [{"message": {"content": "This request looks reasonable."}}]
        }

        with (
            patch.object(ai_trust_service.settings, "groq_api_key", '"test-key"'),
            patch.object(ai_trust_service.settings, "groq_model", "llama-test"),
            patch.object(ai_trust_service.urllib.request, "urlopen", return_value=FakeResponse(groq_body)) as urlopen,
        ):
            ai_trust_service.generate_ai_trust_explanation(
                {"business_name": "Favour Fits"},
                {"item_name": "Black hoodie", "amount_kobo": 750000},
                {"score": 95, "verdict": "Trusted", "reasons": ["No disputes on record"]},
            )

        request = urlopen.call_args.args[0]
        self.assertEqual(request.headers["Authorization"], "Bearer test-key")

    def test_generate_ai_trust_explanation_falls_back_to_next_model_on_forbidden(self):
        groq_body = {
            "choices": [{"message": {"content": "Fallback model generated a trust summary."}}]
        }
        forbidden = urllib.error.HTTPError(
            url="https://api.groq.com/openai/v1/chat/completions",
            code=403,
            msg="Forbidden",
            hdrs=None,
            fp=None,
        )

        with (
            patch.object(ai_trust_service.settings, "groq_api_key", "test-key"),
            patch.object(ai_trust_service.settings, "groq_model", "blocked-model"),
            patch.object(
                ai_trust_service.urllib.request,
                "urlopen",
                side_effect=[forbidden, FakeResponse(groq_body)],
            ) as urlopen,
        ):
            result = ai_trust_service.generate_ai_trust_explanation(
                {"business_name": "Favour Fits"},
                {"item_name": "Black hoodie", "amount_kobo": 750000},
                {"score": 95, "verdict": "Trusted", "reasons": ["No disputes on record"]},
            )

        self.assertTrue(result["ai_powered"])
        self.assertEqual(result["model"], ai_trust_service.GROQ_FALLBACK_MODELS[0])
        self.assertEqual(urlopen.call_count, 2)

    def test_generate_ai_trust_explanation_falls_back_when_groq_fails(self):
        with (
            patch.object(ai_trust_service.settings, "groq_api_key", "test-key"),
            patch.object(ai_trust_service.urllib.request, "urlopen", side_effect=TimeoutError("timeout")),
        ):
            result = ai_trust_service.generate_ai_trust_explanation(
                {"business_name": "Fresh Vendor"},
                {"amount_kobo": 5000000},
                {
                    "score": 40,
                    "verdict": "High Risk",
                    "reasons": ["Vendor has no completed transactions yet"],
                },
            )

        self.assertFalse(result["ai_powered"])
        self.assertEqual(result["engine"], "rules-fallback")
        self.assertIn("High Risk", result["summary"])


if __name__ == "__main__":
    unittest.main()
