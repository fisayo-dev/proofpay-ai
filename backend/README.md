# ProofPay AI Backend

FastAPI backend for AI-scored payment requests, Kora checkout handoff, verified webhook processing, and payment status tracking.

## Key Environment Variables

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KORA_PUBLIC_KEY`
- `KORA_SECRET_KEY`
- `KORA_WEBHOOK_URL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `XGBOOST_FRAUD_MODEL_PATH` (optional)
- `FRONTEND_BASE_URL`
- `BACKEND_BASE_URL`
- `SESSION_SECRET`
- `ENV`

## Core API Endpoints

- `GET /api/v1/health`
- `POST /api/v1/vendors`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/vendors/{vendor_id}`
- `GET /api/v1/vendors/{vendor_id}/requests`
- `GET /api/v1/vendors/{vendor_id}/metrics`
- `GET /api/v1/vendors/{vendor_id}/trust-history`
- `GET /api/v1/vendors/{vendor_id}/badge`
- `POST /api/v1/payment-requests`
- `POST /api/v1/trust/predict`
- `GET /api/v1/payment-requests/{id}`
- `GET /api/v1/public/r/{public_slug}`
- `GET /api/v1/payments/{payment_request_id}/status`
- `GET /api/v1/payments/kora/config/{payment_request_id}`
- `POST /api/v1/payments/{payment_request_id}/reconcile`
- `POST /api/v1/payments/kora/webhook`
- `POST /api/v1/delivery/confirm`
- `POST /api/v1/disputes`

## Groq AI Layer

The public buyer endpoint calls Groq server-side when `GROQ_API_KEY` is configured:

- `GET /api/v1/public/r/{public_slug}` returns `trust.ai_summary`.
- The summary explains the trust score, fraud/anomaly signals, and buyer recommendation in plain English.
- If Groq fails or the key is missing, the backend returns a deterministic fallback summary.

## Reputation and Fraud Layer

- Vendor badges are derived from trust score and completed transaction count: `Top Seller`, `Verified`, `Rising Star`, or `New Vendor`.
- Trust history comes from saved `trust_checks`, so the frontend can draw a reputation graph.
- `POST /api/v1/trust/predict` estimates how much a successful payment can improve a vendor score.
- XGBoost fraud scoring is optional. If `xgboost` or a model file is unavailable, the deterministic anomaly rules still run.

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
