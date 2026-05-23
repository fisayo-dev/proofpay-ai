# ProofPay AI - Demo Checklist

## 30 Minutes Before Presentation

- [ ] Open backend health endpoint and confirm OK
- [ ] Call `POST /api/v1/demo/seed`
- [ ] Save `vendor_id`, `payment_request_id`, `public_slug`, `public_url`, and `kora_reference`
- [ ] Open buyer page with `public_url`
- [ ] Confirm trust score loads
- [ ] Confirm `POST /api/v1/demo/simulate-payment` can mark a request as paid
- [ ] Confirm Fisayo's frontend deployment is live
- [ ] Confirm Divine has Kora dashboard and backend logs open
- [ ] Confirm fallback screenshots are available offline

## During Demo

- [ ] Use live product first
- [ ] Keep narration under 2 minutes
- [ ] If Kora is unstable, call demo simulation endpoint
- [ ] If frontend fails, show public API JSON
- [ ] If backend fails, switch to screenshots immediately

## Closing Line

"AI verifies trust. Kora powers payment. ProofPay AI creates accountability."
