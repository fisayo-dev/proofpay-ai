import unittest
from unittest.mock import patch

from app.services.webhook_service import generate_kora_signature_for_test


class KoraWebhookRouteTest(unittest.TestCase):
    def _payload(self):
        return {
            "event": "charge.success",
            "data": {
                "amount": 7500,
                "status": "success",
                "currency": "NGN",
                "reference": "PPAY-123",
                "payment_reference": "PPAY-123",
            },
        }

    def test_kora_webhook_probe_returns_ok(self):
        from app.api.v1 import routes_webhooks

        self.assertEqual(
            routes_webhooks.get_kora_webhook_probe(),
            {
                "status": "ok",
                "service": "proofpay-kora-webhook",
            },
        )

    def test_valid_success_webhook_marks_payment_once(self):
        from app.api.v1 import routes_webhooks

        payload = self._payload()
        signature = generate_kora_signature_for_test(payload, "secret")

        with (
            patch.object(routes_webhooks.settings, "kora_secret_key", "secret"),
            patch.object(routes_webhooks, "save_webhook_event") as save_event,
            patch.object(routes_webhooks, "already_processed", return_value=False),
            patch.object(routes_webhooks, "mark_payment_paid", return_value="req_123") as mark_paid,
            patch.object(routes_webhooks, "mark_payment_failed") as mark_failed,
            patch.object(routes_webhooks, "mark_webhook_processed") as mark_processed,
        ):
            result = routes_webhooks.process_kora_webhook_event(payload, signature)

        self.assertEqual(
            result,
            {
                "received": True,
                "duplicate": False,
                "signature_valid": True,
                "kora_reference": "PPAY-123",
                "payment_request_id": "req_123",
                "status": "paid",
            },
        )
        save_event.assert_called_once_with("charge.success", "PPAY-123", payload, True)
        mark_paid.assert_called_once_with("PPAY-123", payload)
        mark_failed.assert_not_called()
        mark_processed.assert_called_once_with("charge.success", "PPAY-123")

    def test_duplicate_valid_webhook_does_not_update_payment_twice(self):
        from app.api.v1 import routes_webhooks

        payload = self._payload()
        signature = generate_kora_signature_for_test(payload, "secret")

        with (
            patch.object(routes_webhooks.settings, "kora_secret_key", "secret"),
            patch.object(routes_webhooks, "save_webhook_event") as save_event,
            patch.object(routes_webhooks, "already_processed", return_value=True),
            patch.object(routes_webhooks, "mark_payment_paid") as mark_paid,
            patch.object(routes_webhooks, "mark_payment_failed") as mark_failed,
            patch.object(routes_webhooks, "mark_webhook_processed") as mark_processed,
        ):
            result = routes_webhooks.process_kora_webhook_event(payload, signature)

        self.assertEqual(
            result,
            {
                "received": True,
                "duplicate": True,
                "signature_valid": True,
                "kora_reference": "PPAY-123",
            },
        )
        save_event.assert_called_once_with("charge.success", "PPAY-123", payload, True)
        mark_paid.assert_not_called()
        mark_failed.assert_not_called()
        mark_processed.assert_not_called()

    def test_invalid_signature_is_saved_but_does_not_update_payment(self):
        from app.api.v1 import routes_webhooks

        payload = self._payload()

        with (
            patch.object(routes_webhooks.settings, "kora_secret_key", "secret"),
            patch.object(routes_webhooks, "save_webhook_event") as save_event,
            patch.object(routes_webhooks, "already_processed") as already,
            patch.object(routes_webhooks, "mark_payment_paid") as mark_paid,
            patch.object(routes_webhooks, "mark_payment_failed") as mark_failed,
            patch.object(routes_webhooks, "mark_webhook_processed") as mark_processed,
        ):
            result = routes_webhooks.process_kora_webhook_event(payload, "bad-signature")

        self.assertEqual(
            result,
            {
                "received": True,
                "duplicate": False,
                "signature_valid": False,
                "kora_reference": "PPAY-123",
            },
        )
        save_event.assert_called_once_with("charge.success", "PPAY-123", payload, False)
        already.assert_not_called()
        mark_paid.assert_not_called()
        mark_failed.assert_not_called()
        mark_processed.assert_not_called()

    def test_raw_body_signature_verification_is_used_when_available(self):
        from app.api.v1 import routes_webhooks

        payload = self._payload()
        raw_body = b'{"event": "charge.success", "data": {"amount": 7500, "status": "success", "currency": "NGN", "reference": "PPAY-123", "payment_reference": "PPAY-123"}}'

        with (
            patch.object(routes_webhooks.settings, "kora_secret_key", "secret"),
            patch.object(routes_webhooks, "verify_kora_signature_from_body", return_value=True) as verify_raw,
            patch.object(routes_webhooks, "verify_kora_signature") as verify_dict,
            patch.object(routes_webhooks, "save_webhook_event") as save_event,
            patch.object(routes_webhooks, "already_processed", return_value=False),
            patch.object(routes_webhooks, "mark_payment_paid", return_value="req_123") as mark_paid,
            patch.object(routes_webhooks, "mark_payment_failed") as mark_failed,
            patch.object(routes_webhooks, "mark_webhook_processed") as mark_processed,
        ):
            result = routes_webhooks.process_kora_webhook_event(payload, "sig", raw_body)

        self.assertEqual(
            result,
            {
                "received": True,
                "duplicate": False,
                "signature_valid": True,
                "kora_reference": "PPAY-123",
                "payment_request_id": "req_123",
                "status": "paid",
            },
        )
        verify_raw.assert_called_once_with(raw_body, "sig", "secret")
        verify_dict.assert_not_called()
        save_event.assert_called_once_with("charge.success", "PPAY-123", payload, True)
        mark_paid.assert_called_once_with("PPAY-123", payload)
        mark_failed.assert_not_called()
        mark_processed.assert_called_once_with("charge.success", "PPAY-123")


if __name__ == "__main__":
    unittest.main()
