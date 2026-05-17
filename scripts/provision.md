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
4. SQL Editor → run, in order: 0001_init, 0002_seed_global, 0003_seed_awcs, 0004_storage_receipts_push.
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
supabase secrets set \
  RAZORPAY_WEBHOOK_SECRET='your-secret' \
  RAZORPAY_KEY_ID='rzp_test_…' \
  RAZORPAY_KEY_SECRET='your-key-secret'
supabase functions deploy razorpay-webhook
supabase functions deploy issue-80g-receipt
supabase functions deploy send-push
supabase functions deploy auto-route
```

Verify: `curl https://YOUR-PROJECT.supabase.co/functions/v1/razorpay-webhook -H 'content-type: application/json' -d '{}'` → 401 invalid signature.

## 4 · Web deploy (Vercel) (30 min)

1. Connect GitHub repo. Root directory: `app`. Framework: Vite (auto).
2. Env vars (Production + Preview):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`, `VITE_DEV_ORG_SLUG=awcs`, `VITE_SENTRY_DSN` (later), `VITE_APP_VERSION=0.1.0`
3. Deploy. Add custom domain `karuna.app`.

Smoke test: landing renders → `/awcs/donate` shows products → OTP sign-in works on your phone.

## 5 · Native deploy (EAS) (45 min)

```bash
cd app-mobile
npm install
npx expo install
cp .env.example .env.local
npm install -g eas-cli
eas login
eas init
eas build:configure
eas build --platform ios --profile preview
eas build --platform android --profile preview
eas submit --platform ios --latest
eas submit --platform android --latest
```

Requires Apple Developer (₹8,500/yr) + Google Play Console ($25 one-time).

## 6 · Sentry (15 min)

1. Create 3 projects: `karuna-web` (React), `karuna-mobile` (React Native), `karuna-edge` (Deno).
2. Web: set `VITE_SENTRY_DSN` in Vercel.
3. Mobile: `EXPO_PUBLIC_SENTRY_DSN` in EAS secrets.
4. Edge: `supabase secrets set SENTRY_DSN_EDGE='...'`.
5. Trigger a test error from each; verify scrubbing.

## 7 · First real test rescue (60 min)

- Submit a fake rescue from the app.
- Coordinator sees it on web; advances status.
- Tracker on phone updates.
- No Sentry errors. 4 case_events rows.

Then tell AWCS' coordinator: "we're ready for you to try one."

## 8 · Compliance (parallel)

- [ ] Privacy policy + TOS drafted.
- [ ] DPA signed with AWCS.
- [ ] Cookie consent on web.
- [ ] 80G receipt template reviewed by AWCS' CA.
- [ ] DPDP Act compliance.

## When something goes wrong

| Symptom | First check |
|---|---|
| OTP doesn't arrive | Supabase Auth logs + Twilio dashboard; check DLT registration |
| Case insert RLS error | Confirm `reporter_anon=true` passed; check anon policy |
| Webhook 401 | RAZORPAY_WEBHOOK_SECRET mismatch |
| Receipt PDF missing | Edge function logs; check `receipts` bucket policy |
| "Org not found" | 0003_seed_awcs not run; verify `organizations.slug = 'awcs'` |
| Push doesn't arrive | `profiles.push_token` empty; re-launch mobile app |
