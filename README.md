# ProofPay AI

AI-verified payment requests for student vendors and social-commerce sellers.

> Build trust before payment. Pay safer with Kora.

## Kora Hackathon Submission

ProofPay AI was built for the Covenant University Kora Hackathon 2.0.

- Theme: Build the Future with Kora
- Team: His Glory
- Team size: 3 members
- Category fit: AI and Intelligent Systems, Commerce and Retail Innovation, Financial Inclusion
- Frontend: Next.js PWA deployed on Vercel
- Backend: FastAPI deployed on Hugging Face Spaces
- Database: Supabase Postgres
- Payment infrastructure: Kora Checkout and Kora webhooks
- AI layer: Explainable trust scoring, XGBoost-ready anomaly detection, and Groq-generated buyer explanations

## Live Links

- Live app: https://proofpay-ai.vercel.app
- Backend API: https://olatunjitobi-proofpay-ai-backend.hf.space
- API docs: https://olatunjitobi-proofpay-ai-backend.hf.space/docs
- Health check: https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/health
- Kora webhook URL: https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/payments/kora/webhook



ProofPay AI helps buyers verify student vendors and small social-commerce sellers before paying, using explainable AI trust scoring and Kora-powered payment requests.

## The Problem

Students, parents, and young buyers often pay vendors through WhatsApp, Instagram, referrals, screenshots, and direct bank transfers. These informal flows are fast, but they are risky.

Buyers usually do not know:

- Whether the seller is reliable
- Whether the payment request is genuine
- Whether the account name matches the vendor
- Whether the amount is suspicious
- Whether payment status can be trusted after payment

Current workarounds like screenshots, referrals, manual confirmation, and "send proof of payment" are slow, unreliable, and easy to fake.

## The Solution

ProofPay AI adds a trust layer before payment.

A seller creates a Kora-powered payment request. Before the buyer pays, the backend generates an explainable trust score using vendor and transaction signals. The buyer opens a public payment link, reviews the vendor, item, amount, trust score, trust verdict, and score reasons, then pays securely through Kora.

Kora confirms the payment through a signed webhook, and the backend updates payment status only after verification.

## Why Kora Matters

Kora is not decorative in this project. ProofPay AI depends on Kora for the actual payment infrastructure.

ProofPay AI uses Kora to:

- Generate a checkout-ready payment flow
- Attach each payment request to a unique Kora reference
- Let buyers pay securely through Kora Checkout
- Receive Kora payment events through webhooks
- Verify payment status from backend-controlled logic
- Prevent the frontend from faking successful payments

Without Kora, ProofPay AI would only be a trust display page. With Kora, it becomes a trusted payment request system.

## Core Demo Flow

```text
Seller signs up or uses a demo vendor
  -> Seller creates a payment request
  -> Backend generates a Kora reference and public buyer link
  -> Trust engine scores the request
  -> Buyer opens the public link
  -> Buyer sees trust score, verdict, and reasons
  -> Buyer pays with Kora
  -> Kora sends a signed webhook
  -> Backend verifies the webhook and updates payment status
  -> Seller dashboard shows verified payment status
```

## AI / Intelligent Automation

ProofPay AI uses an explainable trust scoring engine, fraud/anomaly detection, and Groq AI-generated buyer explanations for the hackathon MVP.

We intentionally use a hybrid AI approach:

- Deterministic scoring checks vendor/payment signals reliably.
- Fraud/anomaly detection flags unusual payment patterns such as large payments from new vendors or high dispute rates.
- XGBoost fraud scoring is supported as an optional model layer through `XGBOOST_FRAUD_MODEL_PATH`. If a trained model is unavailable, ProofPay safely falls back to deterministic fraud rules.
- Groq AI converts the trust score, anomaly flags, and payment context into a plain-English buyer explanation.
- Vendor reputation includes badge logic, trust score history, and a prediction of how a successful transaction can improve trust.

This avoids pretending to have a trained fraud model without enough real fraud data, while still giving users an intelligent explanation they can understand immediately. Kora webhooks give ProofPay AI the verified payment events needed to evolve into a stronger ML risk model over time.

### Trust Score Inputs

- Vendor profile completeness
- Completed transaction history
- Total transaction count
- Dispute count and dispute rate
- Bank account name consistency
- Amount reasonableness by category
- Anomaly flags for unusual payment patterns

### Trust Verdicts

| Score Range | Verdict |
| --- | --- |
| 80-100 | Trusted |
| 55-79 | Caution |
| 30-54 | High Risk |
| 0-29 | Manual Review Needed |

Important safety rule: ProofPay AI does not call anyone a scammer. It shows risk signals and helps the buyer make a safer decision.

### Groq AI Explanation

The buyer page includes a natural-language trust explanation generated server-side with Groq when `GROQ_API_KEY` is available. If Groq is unavailable, ProofPay falls back to a deterministic explanation so checkout is never blocked by an AI provider outage.

Example:

```text
Favour Fits is rated Trusted for this payment because the vendor has a complete profile, a strong transaction history, and no disputes on record. Confirm the item and delivery details, then proceed through Kora Checkout.
```

### Example Trust Response

```json
{
  "score": 95,
  "verdict": "Trusted",
  "confidence": "high",
  "reasons": [
    "Vendor profile is fully complete",
    "Vendor has 14 completed transactions",
    "No disputes on record",
    "Account name is consistent with business name",
    "Payment amount is normal for this vendor category"
  ],
  "model_version": "rules-v1-anomaly"
}
```

## Our Pillars

### Financial Inclusion

ProofPay AI supports informal sellers who may not have formal stores, advanced business tools, or strong digital reputation. Student vendors, food sellers, fashion sellers, event ticket sellers, and campus service providers can create trusted payment requests without building a full e-commerce platform.

### Simplified Payments

Buyers do not need to create an account. They open a link, review the trust context, and pay with Kora. Vendors get a dashboard and shareable payment links. The payment flow stays simple while the backend handles trust, references, and status verification.

### Viability and Scalability

The MVP starts with Covenant University student commerce because the user group is reachable and the pain is familiar. The same model can expand to WhatsApp vendors, Instagram sellers, event organizers, freelancers, creators, and small businesses.

## Key Features

- Vendor signup and dashboard
- Vendor and buyer signup/login
- Create Kora-powered payment requests
- Public buyer verification page
- Explainable AI trust score
- Vendor badge and reputation history
- Trust verdict and score reasons
- Kora checkout configuration
- Signed Kora webhook handler
- Payment status endpoint
- Idempotent webhook processing
- Delivery confirmation and dispute endpoints
- Demo seed and simulate-payment endpoints for presentation fallback

## API Surface

```http
GET  /api/v1/health

POST /api/v1/vendors
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/vendors/{vendor_id}
GET  /api/v1/vendors/{vendor_id}/requests
GET  /api/v1/vendors/{vendor_id}/metrics
GET  /api/v1/vendors/{vendor_id}/trust-history
GET  /api/v1/vendors/{vendor_id}/badge

POST /api/v1/payment-requests
POST /api/v1/trust/score
POST /api/v1/trust/predict
GET  /api/v1/payment-requests/{request_id}
GET  /api/v1/public/r/{public_slug}

GET  /api/v1/payments/{payment_request_id}/status
GET  /api/v1/payments/kora/config/{payment_request_id}
POST /api/v1/payments/{payment_request_id}/reconcile
POST /api/v1/payments/kora/webhook

POST /api/v1/delivery/confirm
POST /api/v1/disputes

GET  /api/v1/demo/trust-score
GET  /api/v1/demo/scenarios
POST /api/v1/demo/seed
POST /api/v1/demo/simulate-payment
```

## Example Payment Request

```json
{
  "vendor_id": "replace-with-real-vendor-id",
  "buyer_name": "Daniel",
  "buyer_email": "daniel@example.com",
  "item_name": "Black hoodie",
  "item_description": "Oversized black hoodie, size L",
  "amount_kobo": 750000,
  "currency": "NGN",
  "delivery_method": "CU hostel delivery",
  "expected_delivery_date": "2026-05-25"
}
```

## Example Response

```json
{
  "payment_request_id": "uuid",
  "public_slug": "ppai_7H2KQ9",
  "public_url": "https://proofpay-ai.vercel.app/r/ppai_7H2KQ9",
  "kora_reference": "PPAY-20260529-7H2KQ9",
  "status": "created",
  "trust": {
    "score": 95,
    "verdict": "Trusted",
    "confidence": "high",
    "reasons": [
      "Vendor profile is fully complete",
      "Vendor has 14 completed transactions",
      "No disputes on record",
      "Payment amount is normal for this vendor category"
    ],
    "model_version": "rules-v1-anomaly"
  },
  "checkout_config": {
    "key": "KORA_PUBLIC_KEY_ONLY",
    "reference": "PPAY-20260529-7H2KQ9",
    "amount": 7500,
    "currency": "NGN",
    "customer": {
      "name": "Daniel",
      "email": "daniel@example.com"
    },
    "notification_url": "https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/payments/kora/webhook"
  }
}
```

## Technical Architecture

```text
Next.js PWA on Vercel
  |
  | calls REST API
  v
FastAPI backend on Hugging Face Spaces
  |
  | reads/writes payment data
  v
Supabase Postgres
  |
  | checkout reference
  v
Kora Checkout
  |
  | signed webhook event
  v
FastAPI webhook handler
  |
  | verifies signature and updates once
  v
Payment status API -> Frontend dashboard
```

## Production-Ready Decisions

ProofPay AI is a hackathon MVP, but it is designed with payment safety in mind.

- Secret keys stay server-side.
- Kora public key is the only Kora key exposed to the frontend.
- Payment status is never trusted from the frontend.
- Kora webhooks are verified before payment state changes.
- Duplicate webhook events are handled idempotently.
- Raw webhook events are stored for auditability and debugging.
- Money is stored in kobo to avoid floating point errors.
- Trust scores are stored as snapshots so the buyer sees the score at request creation time.
- The backend stays stateless where possible.
- Demo fallback endpoints exist for presentation reliability.

## Database Overview

Core tables:

- `vendors`: seller profile, business details, transaction counts, dispute counts
- `payment_requests`: buyer-facing payment request, amount, Kora reference, status, trust snapshot
- `trust_checks`: score, verdict, model version, reasons, feature snapshot
- `transactions`: Kora reference, amount, payment status, webhook verification flag
- `webhook_events`: raw Kora event payloads, signature validity, processing status
- `disputes`: buyer dispute records

## Market Reality

There is a market, but the wedge must stay narrow.

Students will not pay for a generic finance app. They may accept a small transaction fee if the product helps them avoid losing money, prove seller credibility, or collect payment faster. The first users are student vendors, fashion sellers, food sellers, event ticket sellers, freelance designers, campus service providers, parents, and buyers who currently rely on manual trust.

Substitutes include WhatsApp referrals, Instagram reputation, screenshots, direct transfer, and generic payment links. ProofPay AI wins only if it makes trust visible before payment while keeping the payment flow fast.

## Business Model

Possible monetization paths:

- Small transaction fee on successful verified payments
- Vendor subscription for branded trust pages and dashboard history
- Premium vendor verification
- Trust Score API for marketplaces and social-commerce tools

For the hackathon MVP, the strongest business model is a low fee per successful payment because vendors pay only when ProofPay helps them collect money.

## What We Did Not Build

We intentionally avoided overbuilding.

- No full marketplace
- No wallet
- No escrow claim
- No chat system
- No heavy KYC
- No fake complex ML model
- No admin analytics suite
- No payout engine

The MVP focuses on one valuable flow: trusted payment request -> Kora payment -> verified status.



### Team Dynamics

Team His Glory has 3 members, which fits the required 2-4 member range. The work is split across frontend, backend/Kora integration, and AI/product/documentation so one person is not the sole contributor.

| Member | Role | Main Contribution |
| --- | --- | --- |
| Fisayo | Frontend Developer | PWA interface, landing page, seller dashboard, buyer verification page |
| Lekan | Backend / Kora Integration | Kora checkout flow, payment references, webhook integration, payment status |
| Toby | AI/ML, Backend Support, Product Strategy | Trust scoring engine, backend support, demo story, documentation, pitch |



### Repository

This is a mono-repo containing both frontend and backend code.

- Frontend directory: `web/`
- Backend directory: `backend/`
- Demo assets: `demo/`
- Product documentation: `docs/`



### Deployment

- Frontend live link: https://proofpay-ai.vercel.app
- Backend live link: https://olatunjitobi-proofpay-ai-backend.hf.space

### Kora API Integration

The project integrates Kora through checkout configuration, payment references, and signed webhook verification. The webhook route for Kora dashboard configuration is:

```text
https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/payments/kora/webhook
```

### AI Usage Disclosure

AI tools were used to support productivity during the hackathon.

AI-assisted areas:

- Product strategy refinement
- README and documentation drafting
- Trust score planning
- Test case drafting
- Pitch structure
- Code explanation and debugging support

Human-built and human-reviewed areas:

- Final product direction
- Feature selection
- Frontend implementation
- Backend implementation
- Kora configuration
- Deployment
- Testing
- Final demo decisions

AI was used as an assistant, not as a replacement for registered team contribution. Final implementation decisions were reviewed and adapted by the team.





## Local Setup

### Backend

```powershell
cd backend
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```powershell
cd web
npm install
npm run dev
```

## Environment Variables

Backend environment variables:

```text
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
KORA_PUBLIC_KEY=
KORA_SECRET_KEY=
KORA_WEBHOOK_URL=
FRONTEND_BASE_URL=
BACKEND_BASE_URL=
SESSION_SECRET=
ENV=
```

Frontend environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=
```

Do not commit `.env` files or secret keys.

## Tests

Run backend tests from the repository root:

```powershell
$env:PYTHONPATH="C:\Dev\proofpay-ai\backend"
.\.venv\Scripts\python.exe -m unittest discover -s backend\tests
```





Core message:

> ProofPay AI does not just create payment links. It creates payment links with trust context.



## Final Verdict

ProofPay AI is built around a real payment friction: people want to trust who they are paying before they pay.

It is small enough to ship during a hackathon, clear enough to demo in two minutes, and scalable enough to become a trust layer for social commerce.

Build trust before payment. Pay safer with Kora.
