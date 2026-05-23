# ProofPay AI - Demo Package

## Before You Present

1. Call `POST /api/v1/demo/seed`
2. Save the response:
   - `vendor_id`
   - `public_slug`
   - `public_url`
   - `payment_request_id`
   - `kora_reference`
3. Open `public_url` in browser -> confirm trust score loads
4. Share `public_url` with Fisayo for frontend demo

## Demo Flow

Step 1: Open landing page
Step 2: Click "Create trusted payment request"
Step 3: Fill form -> submit -> copy share link
Step 4: Open buyer trust page -> show score 95/100 Trusted
Step 5: Click "Pay securely with Kora"
Step 6: Complete Kora sandbox payment OR call simulate-payment
Step 7: Show status updating to Paid
Step 8: Show seller dashboard updated

## Emergency Fallback

If backend is down:
-> Open `fallback_screenshots/` folder
-> Walk through screenshots with narration
-> Use `demo_script.md` for exact words

If frontend is broken:
-> Open public API directly in browser
-> Show JSON responses with narration
-> Explain what the UI would show

## Closing Line

"AI verifies trust. Kora powers payment. ProofPay AI creates accountability."
