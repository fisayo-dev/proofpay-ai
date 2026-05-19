# ProofPay AI - Team Summary

## What we are building
A PWA that lets buyers verify student vendors before paying through Kora.

## The one flow that must work
1. Seller creates payment request
2. AI trust score is generated
3. Buyer sees trust score + vendor details
4. Buyer pays with Kora
5. Kora webhook confirms payment
6. Dashboard shows paid status

## What we are NOT building
- No marketplace
- No chat
- No wallet
- No escrow
- No complex KYC

## Who owns what
- Fisayo: All frontend screens
- Divine: Kora integration + backend APIs + webhooks
- Toby: Trust score logic + database + product + pitch

## The buyer page is the most important screen
It must answer three questions instantly:
1. Who is the vendor?
2. How much am I paying?
3. Is this request trustworthy?

## Demo script (2 minutes)
1. Create vendor profile
2. Create payment request for Black hoodie - NGN 7,500
3. Open buyer page - show trust score 95/100 Trusted
4. Click Pay with Kora
5. Show payment confirmed
6. Show dashboard updated

## End of Day Checklist
| Task | Done? |
| --- | --- |
| GitHub repo created and team invited | Yes / No |
| Supabase project created and credentials saved | Yes / No |
| All 7 database tables created in Supabase | Yes / No |
| `.env.example` committed to GitHub | Yes / No |
| FastAPI skeleton running locally | Yes / No |
| `/api/v1/health` returns OK | Yes / No |
| Trust scoring function written and tested | Yes / No |
| Demo data JSON file created | Yes / No |
| Team summary document shared | Yes / No |
| Divine confirmed Kora sandbox access | Yes / No |
| Fisayo confirmed Vercel account ready | Yes / No |

## What You Hand Off Tonight
| To | What |
| --- | --- |
| Divine | Supabase credentials, `.env.example`, database schema, API endpoint list, demo data JSON |
| Fisayo | Demo data JSON, product summary, route map, component list from PRD |
| Both | GitHub repo access, team summary doc |

## Day 1 Success Statement
By end of Day 1, the team should be able to start building independently on Day 2 without asking Toby basic setup questions.

If Divine can connect to the database and Fisayo can see the route structure, Day 1 is a success.
