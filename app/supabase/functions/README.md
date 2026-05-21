# Edge Functions

Deno-based serverless functions that live next to Supabase. Deployed via the Supabase CLI.

## Functions

| Function | Trigger | Purpose |
|---|---|---|
| `razorpay-webhook` | Razorpay HTTPS webhook | Verify HMAC, mark donation paid, kick off receipt issuance, link sponsorship → case |
| `create-razorpay-order` | Browser POST (donor portal) | Validate amount against canonical product price, upsert donor, create RZP order, insert pending donation, return Checkout payload |
| `issue-80g-receipt` | Internal (called by webhook or admin) | Generate PDF via `pdf-lib`, upload to Storage `receipts/{org_slug}/{KR-D-X-00000001}.pdf`, email donor via Resend with PDF link, write receipt + email status back to donation |
| `submit-anonymous-report` | Browser POST (public report form) | Verify Cloudflare Turnstile, rate-limit by IP (5/h soft, 10/h → 24h block), insert case via service-role |
| `send-push` | Called from client / triggered after status change | Look up reporter + sponsor push tokens; send Expo Push with editorial copy |
| `auto-route` | Called after `cases` insert when kind ≠ bird | Match case to a partner NGO; write `case_events.kind = 'auto-routed'` or `'flagged'` |

## Deploy

```bash
cd app
supabase login   # one-time
supabase link --project-ref YOUR-PROJECT
supabase functions deploy razorpay-webhook
supabase functions deploy create-razorpay-order
supabase functions deploy issue-80g-receipt
supabase functions deploy submit-anonymous-report
supabase functions deploy send-push
supabase functions deploy auto-route
```

## Required environment

Set per-function in the Supabase dashboard (Project Settings → Edge Functions → Secrets), **not** in the client env:

| Variable | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | all | Auto-set by Supabase; needed for the service client |
| `SUPABASE_SERVICE_ROLE_KEY` | all | Auto-set by Supabase; never leaks to clients |
| `RAZORPAY_WEBHOOK_SECRET` | razorpay-webhook | The same long random string you paste into the Razorpay webhook config |
| `RAZORPAY_KEY_ID` | create-razorpay-order, razorpay-webhook (refunds) | Public key, but never exposed to client — server creates orders, browser only gets order_id + key_id at modal open time |
| `RAZORPAY_KEY_SECRET` | create-razorpay-order | Server-only — used in Basic auth header to Razorpay Orders API |
| `RESEND_API_KEY` | issue-80g-receipt | Resend API key from resend.com (free tier: 100/day, 3000/mo) |
| `RECEIPTS_FROM` | issue-80g-receipt | Optional. Verified sender like `"Karuna · AWCS <receipts@karuna.app>"`. Defaults to `onboarding@resend.dev` (works without domain verification but goes to spam for some donors). |
| `APP_URL` | issue-80g-receipt | Optional. Base URL for in-email links. Defaults to `https://karuna.app` |
| `EXPO_PUSH_ACCESS_TOKEN` | send-push | Optional; only needed when push receipts ramp up. Without it, sends work but you can't query delivery. |
| `TURNSTILE_SECRET_KEY` | submit-anonymous-report | Cloudflare Turnstile secret. Without it, CAPTCHA is skipped (dev mode). Pair with `VITE_TURNSTILE_SITEKEY` on the client. |

## Local development

```bash
cd app
supabase functions serve razorpay-webhook --env-file .env.functions
```

Then in another terminal use `curl` with a fake but signature-valid body. See `scripts/test-razorpay-webhook.sh` (TODO).

## Verifying the Razorpay HMAC manually

```bash
echo -n "$BODY" | openssl dgst -sha256 -hmac "$RAZORPAY_WEBHOOK_SECRET"
```

If the output matches the `X-Razorpay-Signature` header, the signature is valid. Our `verifyRazorpayWebhook` uses constant-time comparison, so a single character mismatch fails.

## What's wired vs. stubbed

**Wired:**
- HMAC verification on razorpay-webhook
- payment.captured → mark donation paid + (if sponsorship) link case + case_events insert
- payment.failed → status update
- subscription.charged → new paid donation row
- subscription.cancelled → status update
- Razorpay order creation (create-razorpay-order) with canonical-amount lookup, donor upsert, pending donation row
- 80G PDF generation in `pdf-lib` (no headless browser)
- Storage upload + `donations.receipt_url` writeback
- Resend email of receipt with brand-styled HTML + plain-text alternative
- Email delivery tracking via `donations.receipt_email_status` (sent / failed / no-email)
- Expo Push send with editorial copy per status
- Partner matching for cattle / wildlife / cruelty / borewell
- Cloudflare Turnstile CAPTCHA verification on submit-anonymous-report
- Per-IP rate limit (5/h soft, 10/h → 24h block) via report_rate_limits + check_report_rate_limit RPC

**Stubbed:**
- WhatsApp template send in `auto-route` — needs BSP integration (M5/M6)
- pg_net trigger to invoke `send-push` automatically — for v1 the client/Edge Function does it explicitly after a status change
- Razorpay subscriptions for recurring donations — currently shows one-time fallback on monthly products (M3)
- Mobile reporter submission migrating to submit-anonymous-report — currently direct insert; planned for M2 along with `device_fingerprint` rate limiting

## Tests

Each function should get one happy-path + one bad-input test. Stored under `app/supabase/functions/__tests__/`. Run with `deno test`.

Not built yet — first add in M2 of the roadmap.
