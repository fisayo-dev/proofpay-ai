# ProofPay AI Backend

FastAPI backend for AI-scored payment requests, Kora checkout handoff, verified webhook processing, and payment status tracking.

## Key Environment Variables

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KORA_PUBLIC_KEY`
- `KORA_SECRET_KEY`
- `KORA_WEBHOOK_URL`
- `FRONTEND_BASE_URL`
- `BACKEND_BASE_URL`
- `SESSION_SECRET`
- `ENV`

## Core API Endpoints

- `GET /api/v1/health`
- `POST /api/v1/vendors`
- `GET /api/v1/vendors/{vendor_id}`
- `GET /api/v1/vendors/{vendor_id}/requests`
- `POST /api/v1/payment-requests`
- `GET /api/v1/payment-requests/{id}`
- `GET /api/v1/public/r/{public_slug}`
- `GET /api/v1/payments/{payment_request_id}/status`
- `GET /api/v1/payments/kora/config/{payment_request_id}`
- `POST /api/v1/payments/{payment_request_id}/reconcile`
- `POST /api/v1/payments/kora/webhook`
- `POST /api/v1/delivery/confirm`
- `POST /api/v1/disputes`

## Kora Flow

1. Create a payment request with `POST /api/v1/payment-requests`.
2. Use the returned `checkout_config` or call `GET /api/v1/payments/kora/config/{payment_request_id}`.
3. Configure Kora Checkout with the public key and reference.
4. Register the webhook URL in Kora as:
   `https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/payments/kora/webhook`
5. Kora webhook events update payment state only after signature verification.

## Local Testing

Run the backend tests from the `backend` folder:

```powershell
python -m unittest discover -s tests
```

If you only want the touched slice:

```powershell
python -m unittest tests.test_routes_payments tests.test_routes_webhooks tests.test_payment_status_service
```
