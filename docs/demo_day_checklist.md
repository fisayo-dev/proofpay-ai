# ProofPay AI - Demo Day Checklist

## 30 Minutes Before Presentation

### Backend

- [ ] Call `GET /api/v1/health` -> confirm OK
- [ ] Call `POST /api/v1/demo/seed` -> save `vendor_id`, `public_slug`, `public_url`
- [ ] Open Supabase dashboard -> confirm tables are accessible
- [ ] Check Hugging Face Space logs -> no errors in last 30 minutes
- [ ] Confirm Hugging Face secrets are set:
  - [ ] `DATABASE_URL`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `KORA_PUBLIC_KEY`
  - [ ] `KORA_SECRET_KEY`
  - [ ] `KORA_WEBHOOK_URL`
  - [ ] `FRONTEND_BASE_URL`
  - [ ] `BACKEND_BASE_URL`
  - [ ] `ENV`

### Frontend

- [ ] Open Vercel deployment -> confirm no build errors
- [ ] Open buyer trust page with demo slug -> confirm trust score loads
- [ ] Open seller dashboard -> confirm demo vendor appears
- [ ] Test pay button -> confirm Kora checkout opens

### Team

- [ ] Toby has demo script memorized
- [ ] Fisayo has frontend open on phone and laptop
- [ ] Divine has Hugging Face logs and Kora dashboard open
- [ ] Fallback screenshots are accessible offline

## During Presentation

- [ ] Use live product first
- [ ] If live product fails -> switch to screenshots immediately
- [ ] Never apologize for more than 5 seconds -> keep moving
- [ ] End with the closing line every time:

> "AI verifies trust. Kora powers payment. ProofPay AI creates accountability."

## Fallback Order

1. Live product
2. Screen recording of working demo
3. Static screenshots with narration
4. Demo route JSON responses shown in browser

## Live URLs

- Backend health: `https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/health`
- Demo seed: `https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/demo/seed`
- Demo trust score: `https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/demo/trust-score`
- Demo scenarios: `https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/demo/scenarios`
- Swagger docs: `https://olatunjitobi-proofpay-ai-backend.hf.space/docs`
