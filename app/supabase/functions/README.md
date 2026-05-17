# Edge Functions

Deno-based serverless functions that live next to Supabase. Deployed via the Supabase CLI.

## Functions

| Function | Trigger | Purpose |
|---|---|---|
| `razorpay-webhook` | Razorpay HTTPS webhook | Verify HMAC, mark donation paid, kick off receipt issuance, link sponsorship → case |
| `issue-80g-receipt` | Internal (called by webhook or admin) | Generate PDF via `pdf-lib`, upload to Storage `receipts/{org_slug}/{KR-D-X-00000001}.pdf`, write `receipt_url` back to donation |
| `send-push` | Called from client / triggered after status change | Look up reporter + sponsor push tokens; send Expo Push with editorial copy |
| `auto-route` | Called after `cases` insert when kind ≠ bird | Match case to a partner NGO; write `case_events.kind = 'auto-routed'` or `'flagged'` |

## Deploy

```bash
cd app
supabase login
supabase link --project-ref YOUR-PROJECT
supabase functions deploy razorpay-webhook
supabase functions deploy issue-80g-receipt
supabase functions deploy send-push
supabase functions deploy auto-route
```

## Required environment

Set per-function in Supabase dashboard → Edge Functions → Secrets:

| Variable | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | all | Auto-set by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | all | Auto-set by Supabase |
| `RAZORPAY_WEBHOOK_SECRET` | razorpay-webhook | Same long random string pasted into Razorpay webhook config |
| `RAZORPAY_KEY_ID` | (future, refunds) | Public key |
| `RAZORPAY_KEY_SECRET` | (future) | Server-only |
| `RESEND_API_KEY` | issue-80g-receipt (TODO) | For emailing receipt PDF link |

## Local dev

```bash
supabase functions serve razorpay-webhook --env-file .env.functions
```

## Verifying HMAC manually

```bash
echo -n "$BODY" | openssl dgst -sha256 -hmac "$RAZORPAY_WEBHOOK_SECRET"
```

If this matches `X-Razorpay-Signature`, the signature is valid. Our `verifyRazorpayWebhook` uses constant-time comparison.

## Wired vs. stubbed

**Wired:** HMAC verification, payment.captured + payment.failed + subscription handlers, real PDF generation with `pdf-lib`, Storage upload, Expo Push send with editorial copy, partner matching.

**Stubbed:** email sending in issue-80g-receipt (needs Resend/Postmark), WhatsApp template in auto-route (needs BSP), pg_net trigger to auto-invoke send-push.
