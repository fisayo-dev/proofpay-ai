import unittest

from app.services.payment_request_service import build_public_url, get_kora_notification_url


class PaymentRequestUrlTest(unittest.TestCase):
    def test_build_public_url_handles_trailing_frontend_slash(self):
        result = build_public_url("https://proofpay-ai.vercel.app/", "ppai_DEMO")

        self.assertEqual(result, "https://proofpay-ai.vercel.app/r/ppai_DEMO")

    def test_build_public_url_handles_plain_frontend_base_url(self):
        result = build_public_url("https://proofpay-ai.vercel.app", "ppai_DEMO")

        self.assertEqual(result, "https://proofpay-ai.vercel.app/r/ppai_DEMO")

    def test_get_kora_notification_url_prefers_configured_webhook(self):
        from app.services import payment_request_service

        original_webhook_url = payment_request_service.settings.kora_webhook_url
        original_backend_base_url = payment_request_service.settings.backend_base_url

        try:
            payment_request_service.settings.kora_webhook_url = "https://example.com/webhook"
            payment_request_service.settings.backend_base_url = "https://backend.example.com"

            result = get_kora_notification_url()

            self.assertEqual(result, "https://example.com/webhook")
        finally:
            payment_request_service.settings.kora_webhook_url = original_webhook_url
            payment_request_service.settings.backend_base_url = original_backend_base_url

    def test_get_kora_notification_url_falls_back_to_backend_base_url(self):
        from app.services import payment_request_service

        original_webhook_url = payment_request_service.settings.kora_webhook_url
        original_backend_base_url = payment_request_service.settings.backend_base_url

        try:
            payment_request_service.settings.kora_webhook_url = ""
            payment_request_service.settings.backend_base_url = "https://backend.example.com/"

            result = get_kora_notification_url()

            self.assertEqual(
                result,
                "https://backend.example.com/api/v1/payments/kora/webhook",
            )
        finally:
            payment_request_service.settings.kora_webhook_url = original_webhook_url
            payment_request_service.settings.backend_base_url = original_backend_base_url


if __name__ == "__main__":
    unittest.main()
