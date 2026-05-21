# Provisioning Karuna for AWCS · Hyderabad

> One-shot checklist for going from "branch on GitHub" to "AWCS coordinator runs a real rescue from her phone." Follow top to bottom; estimate 4 focused hours.

---

## Pre-flight (15 min)

- [ ] Credit card on hand. Most accounts are free-tier; a few need a card.
- [ ] AWCS' PAN number and 80G certificate scan ready.
- [ ] Own (or are buying) domain `karuna.app`. Otherwise: Vercel-issued domain.
- [ ] Decided on a transactional email (e.g. `hi@karuna.app`).

## 1 · Supabase project (30 min)

1. https://supabase.com → New project → `karuna-prod` → region `ap-south-1` (Mumbai).
2. Project Settings → API → copy **URL** + **anon public** + **service_role** keys.
3. Authentication → Providers → enable Phone (Twilio) + Google OAuth.
4. SQL Editor → run, in order: 0001_init, 0002_seed_global, 0003_seed_awcs, 0004_storage_receipts_push, 0005_pending_invites, 0006_shifts_comments_metrics, 0007_case_first_photo, 0008_receipt_email_tracking, 0009_report_rate_limit.
5. Verify `case-photos` and `receipts` buckets exist.

## 2 · Razorpay (30 min)

1. Sign up at https://razorpay.com under AWCS' details.
2. KYC: PAN + bank + 80G cert. (1–3 business days.)
3. Test keys from Settings → API Keys.
4. Webhooks → URL: `https://YOUR-PROJECT.supabase.co/functions/v1/razorpay-webhook` → events: payment.captured, payment.failed, subscription.charged, subscription.cancelled → generate a 32-char secret.

## 3 · Edge Functions (45 min)

```bash
cd app
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF

# Set secrets (use the values from steps 1.5, 2.5, and Resend below)
supabase secrets set \
  RAZORPAY_WEBHOOK_SECRET='your-webhook-secret' \
  RAZORPAY_KEY_ID='rzp_test_…' \
  RAZORPAY_KEY_SECRET='your-key-secret' \
  RESEND_API_KEY='re_…' \
  RECEIPTS_FROM='Karuna · AWCS <receipts@karuna.app>' \
  APP_URL='https://karuna.app' \
  TURNSTILE_SECRET_KEY='0x4AAAAAAA…'

# Deploy
supabase functions deploy razorpay-webhook
supabase functions deploy create-razorpay-order
supabase functions deploy issue-80g-receipt
supabase functions deploy submit-anonymous-report
supabase functions deploy send-push
supabase functions deploy auto-route
```

**Cloudflare Turnstile (CAPTCHA on public report form)**:
1. Sign in to https://dash.cloudflare.com → Turnstile → **Add site**
2. Name: `karuna-prod`, domain: `karuna.app` (add `localhost` too for dev). Mode: **Managed** (auto challenge / passive when safe).
3. Copy the **Site key** → Vercel env var `VITE_TURNSTILE_SITEKEY` (Production + Preview)
4. Copy the **Secret key** → `TURNSTILE_SECRET_KEY` in the supabase secrets above
5. Free tier covers 1M challenges/month — far above what AWCS will use

**Resend setup (for 80G receipt emails)**:
1. Sign up at https://resend.com (free tier: 100/day, 3000/month — more than enough for AWCS year-one)
2. Add `karuna.app` under **Domains** and paste the SPF + DKIM + DMARC DNS records they provide
3. Once verified (5–10 min after DNS propagates), set `RECEIPTS_FROM` to `"Karuna · AWCS <receipts@karuna.app>"`. Without verification you can still send from `onboarding@resend.dev` for dev/testing but production donors will hit spam folders
4. Create an API key under **API Keys** → copy to `RESEND_API_KEY` secret above

Verify: `curl https://YOUR-PROJECT.supabase.co/functions/v1/razorpay-webhook -H 'content-type: application/json' -d '{}'` → 401 invalid signature.

## 4 · Web deploy (Vercel) (30 min)

1. Sign up at https://vercel.com → connect GitHub → import `theglowarts14/birds-rescue-app-2026`.
2. **Root directory:** `app`
3. Build settings: framework Vite (auto-detected). Output `dist`. Vercel reads `app/vercel.json`.
4. Environment variables (Production + Preview):
   - `VITE_SUPABASE_URL` = (from 1.4)
   - `VITE_SUPABASE_ANON_KEY` = (from 1.4)
   - `VITE_RAZORPAY_KEY_ID` = (from 2.4) — public; safe to expose
   - `VITE_DEV_ORG_SLUG` = `awcs`
   - `VITE_SENTRY_DSN` = (from step 6) — leave empty if Sentry not set up yet
   - `VITE_APP_VERSION` = `0.1.0`
   - `VITE_TURNSTILE_SITEKEY` = (from step 3 — Cloudflare Turnstile)
5. Deploy. The first build typically takes ~90s.
6. Add custom domain `karuna.app` (or use the Vercel-issued one for now).

Smoke test:
- `https://karuna.app/` → editorial landing renders.
- `https://karuna.app/awcs/donate` → product cards load (means RLS public-read on `donation_products` works).
- `https://karuna.app/login` → can send + verify OTP to your own phone.

---

## 5 · Native deploy (EAS) (45 min)

```bash
cd app-mobile
npm install
npx expo install   # ensures versions align with SDK 51

cp .env.example .env.local
# fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY

npm install -g eas-cli
eas login

# First-time project setup
eas init   # creates EAS project, links to your Expo account
eas build:configure   # validates eas.json against your apple/google creds

# Build a TestFlight + Android internal build
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

When the builds complete (~25 min each), submit to TestFlight or Google Play Internal Testing:
```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

This requires:
- Apple Developer account (₹8,500/year)
- Google Play Console one-time fee ($25)

---

## 6 · Sentry (15 min)

1. Sign up at https://sentry.io → create org → create 3 projects:
   - `karuna-web` (React)
   - `karuna-mobile` (React Native)
   - `karuna-edge` (Deno)
2. Copy each project's DSN.
3. Web: set `VITE_SENTRY_DSN` in Vercel.
4. Mobile: set `EXPO_PUBLIC_SENTRY_DSN` in `app-mobile/.env.local` and in EAS environment vars (`eas secret:create`).
5. Edge: `supabase secrets set SENTRY_DSN_EDGE='...'` (functions read `Deno.env.get('SENTRY_DSN_EDGE')` — wire in `_shared/sentry.ts` later).
6. Trigger a test error from each surface. Verify it appears in Sentry with PII scrubbed.

---

## 7 · First real test rescue (60 min)

The goal: prove the full pipeline works end-to-end before announcing anything.

- [ ] On your phone, open the Expo Go app and load the dev build of `app-mobile` (or use the TestFlight build).
- [ ] Submit a fake report from an empty park: kind=bird, problem=injured, urgency=critical, photo of the sky, area "Test, Hyderabad". Anonymous.
- [ ] Open `https://karuna.app/awcs/team` on a desktop, signed in as the coordinator user you created. The new case should be visible.
- [ ] Mark it as `in-rescue` → `recovering` → `released`.
- [ ] On the reporter phone, the tracker should refresh and show "Released. Back to sky."
- [ ] In Sentry, no errors.
- [ ] In Supabase `case_events`, 4 rows for the test case (received + 3 status changes).

If all of the above works, write to AWCS' coordinator: "we're ready for you to try one this week."

---

## 8 · Compliance & legal (parallel to 1–7)

- [ ] Privacy policy + terms of service drafted (template at `docs/legal/` once it exists).
- [ ] Data processing agreement with AWCS signed (we are data fiduciary on their behalf).
- [ ] Cookie consent banner on the web (lightweight; we only use first-party storage).
- [ ] 80G receipt template reviewed by AWCS' CA.
- [ ] DPDP Act compliance review.

---

## When something goes wrong

Symptom → first thing to check:

| Symptom | Check |
|---|---|
| OTP doesn't arrive | Supabase Auth logs + Twilio dashboard. DLT registration is the most common India-specific blocker. |
| Case insert fails with RLS error | Confirm `reporter_anon=true` is being passed. Check the "anon report" policy in `0001_init.sql`. |
| Webhook gets 401 | `RAZORPAY_WEBHOOK_SECRET` mismatch. Re-paste from Razorpay dashboard. |
| Receipt PDF doesn't appear in Storage | Edge function logs in Supabase. Common: service-role missing the `receipts` bucket policy. |
| Receipt email bounces | Check Resend dashboard for the donor's email; verify `karuna.app` domain SPF/DKIM; re-send via admin Audit page |
| Donor portal shows "Organization not found" | Migration `0003_seed_awcs.sql` didn't run. Re-run; check `organizations.slug = 'awcs'`. |
| Push doesn't arrive | `profiles.push_token` empty for the recipient. Re-launch the mobile app to register. |
| Public report rejected with "rate limited" | Check `report_rate_limits` for the fingerprint; clear `blocked_until` to unblock |
| CAPTCHA stuck on the report form | Add the deployed domain to the Turnstile site in Cloudflare; check console for `400xxx` host-mismatch errors |

---

## After M1: what's next

See `docs/roadmap-6mo.md`. The first thing **not** in this checklist that will need attention: **rate limiting on anonymous report inserts**. The current setup will let someone spam your `/cases` endpoint. Highest-priority follow-up after M1 lands.
