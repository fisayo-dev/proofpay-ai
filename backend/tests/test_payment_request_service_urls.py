import unittest

from app.services.payment_request_service import build_public_url


class PaymentRequestUrlTest(unittest.TestCase):
    def test_build_public_url_handles_trailing_frontend_slash(self):
        result = build_public_url("https://proofpay-ai.vercel.app/", "ppai_DEMO")

        self.assertEqual(result, "https://proofpay-ai.vercel.app/r/ppai_DEMO")

    def test_build_public_url_handles_plain_frontend_base_url(self):
        result = build_public_url("https://proofpay-ai.vercel.app", "ppai_DEMO")

        self.assertEqual(result, "https://proofpay-ai.vercel.app/r/ppai_DEMO")


if __name__ == "__main__":
    unittest.main()
