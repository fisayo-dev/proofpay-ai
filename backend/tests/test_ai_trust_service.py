import unittest
from unittest.mock import patch

from app.services import ai_trust_service


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
        with (
            patch.object(ai_trust_service.settings, "groq_api_key", "test-key"),
            patch.object(ai_trust_service.settings, "groq_model", "llama-test"),
            patch.object(
                ai_trust_service,
                "_call_groq_sdk",
                return_value="Favour Fits looks low risk based on completed transactions and no disputes.",
            ) as groq_call,
        ):
            result = ai_trust_service.generate_ai_trust_explanation(
                {"business_name": "Favour Fits", "completed_transactions": 14},
                {"item_name": "Black hoodie", "amount_kobo": 750000},
                {"score": 95, "verdict": "Trusted", "reasons": ["No disputes on record"]},
        )

        self.assertTrue(result["ai_powered"])
        self.assertEqual(result["engine"], "groq-sdk")
        self.assertEqual(result["model"], "llama-test")
        self.assertIn("low risk", result["summary"])
        self.assertTrue(groq_call.called)

    def test_generate_ai_trust_explanation_strips_quoted_key(self):
        with (
            patch.object(ai_trust_service.settings, "groq_api_key", '"test-key"'),
            patch.object(ai_trust_service.settings, "groq_model", "llama-test"),
            patch.object(
                ai_trust_service,
                "_call_groq_sdk",
                return_value="This request looks reasonable.",
            ) as groq_call,
        ):
            ai_trust_service.generate_ai_trust_explanation(
                {"business_name": "Favour Fits"},
                {"item_name": "Black hoodie", "amount_kobo": 750000},
                {"score": 95, "verdict": "Trusted", "reasons": ["No disputes on record"]},
            )

        self.assertEqual(groq_call.call_args.args[0], "test-key")

    def test_generate_ai_trust_explanation_falls_back_to_next_model_on_forbidden(self):
        with (
            patch.object(ai_trust_service.settings, "groq_api_key", "test-key"),
            patch.object(ai_trust_service.settings, "groq_model", "blocked-model"),
            patch.object(
                ai_trust_service,
                "_call_groq_sdk",
                side_effect=[
                    Exception("HTTP 403: model blocked"),
                    "Fallback model generated a trust summary.",
                ],
            ) as groq_call,
            patch.object(
                ai_trust_service,
                "_call_groq_http",
                side_effect=Exception("HTTP 403: model blocked"),
            ),
        ):
            result = ai_trust_service.generate_ai_trust_explanation(
                {"business_name": "Favour Fits"},
                {"item_name": "Black hoodie", "amount_kobo": 750000},
                {"score": 95, "verdict": "Trusted", "reasons": ["No disputes on record"]},
            )

        self.assertTrue(result["ai_powered"])
        self.assertEqual(result["model"], ai_trust_service.GROQ_FALLBACK_MODELS[0])
        self.assertEqual(groq_call.call_count, 2)

    def test_generate_ai_trust_explanation_falls_back_when_groq_fails(self):
        with (
            patch.object(ai_trust_service.settings, "groq_api_key", "test-key"),
            patch.object(ai_trust_service, "_call_groq_sdk", side_effect=TimeoutError("timeout")),
            patch.object(ai_trust_service, "_call_groq_http", side_effect=TimeoutError("timeout")),
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
