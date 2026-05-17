# Karuna · architecture

> System design, data model summary, request flows, key decisions. Read this before adding a new feature.

**Last updated:** 2026-05-17

---

## 1. System overview

```
                       ┌─────────────────────────────────┐
                       │           Supabase (single)         │
                       │  Postgres · Auth · Storage · Realtime│
                       │           Edge Functions             │
                       └────────┬─────────┬──────────┬───────┘
                                │         │          │
                  ┌─────────────┘         │          └────────────────┐
                  │                       │                           │
        ┌─────────▼──────────┐  ┌─────────▼──────────┐    ┌───────────▼───────────┐
        │ app/  (web · Vite) │  │ app-mobile/ (Expo) │    │ Razorpay   ·  Expo Push│
        │  Team ops          │  │  Reporter          │    │ WhatsApp BSP (later)   │
        │  Donor portal      │  │  Field guide       │    │ Sentry  ·  PostHog     │
        │  Admin             │  │  Tracker · Profile │    │                        │
        └────────────────────┘  └────────────────────┘    └────────────────────────┘
                                                                       ▲
                                                                       │
                                              ┌───────────────────────┘ webhooks
```

**Two clients, one backend, one database.** Everything authenticates against the same Supabase project; data scopes via `org_id` + RLS.

## 2. Components

### 2.1 Postgres (Supabase managed)
- 18 tables across organizations, members, cases, treatments, donations, partners, vet clinics, fosters, inventory, training, festivals, requests, incoming triage queue.
- RLS on every table. The helper `my_org_ids()` security-definer function is the single source for "which orgs can this user see".
- Trigger `gen_short_id` issues human-friendly `AR-2487` ids per org.
- Trigger `log_case_status_change` writes to `case_events` on every status mutation — append-only audit trail.

### 2.2 Supabase Auth
- Phone OTP via Twilio (Indian numbers).
- Google OAuth fallback for desktop users.
- Sessions persist in AsyncStorage (mobile) or localStorage (web).
- `profiles` table mirrors `auth.users` and carries PAN (for 80G) + preferred language.

### 2.3 Supabase Storage
- One bucket: `case-photos` (public read, authenticated write).
- Path convention: `{org_slug}/{case_id}/{timestamp}.{ext}`.
- Images served via CDN-fronted public URLs (donor portal, impact poster, recognition wall).

### 2.4 Supabase Realtime
- Coordinator dashboard subscribes to `cases` channel filtered by `org_id`.
- New case → fan-out toast on every coordinator's Overview.
- Status change → reporter's tracker auto-refreshes.

### 2.5 Edge Functions (Deno)
| Function | Trigger | Job |
|---|---|---|
| `razorpay-webhook` | Razorpay HTTPS webhook | Verify signature, mark donation paid, kick off receipt issuance |
| `issue-80g-receipt` | Internal call from webhook | Generate PDF, write to Storage, email donor |
| `send-push` | Trigger on case-event insert | Look up subscribers (reporter, sponsor), send Expo push |
| `auto-route` | Trigger on case insert when kind = cattle/wildlife/cruelty | Notify the matching partner from `partners` table |
| `import-whatsapp` | WhatsApp BSP webhook (later) | Parse message, classify, insert into `incoming_queue` |

### 2.6 Web client (`app/`)
- Vite + React 18 + TypeScript + Tailwind.
- React Router with org-scoped URLs: `/:orgSlug/{donate,team,admin}`.
- TanStack Query for server state.
- Org context loads the row on first navigation, applies brand colors via `--org-primary` CSS variable.

### 2.7 Native client (`app-mobile/`)
- Expo SDK 51 + RN 0.74 + expo-router.
- 4-tab bottom nav: Report · My reports · Field guide · Profile.
- Same Supabase client (`@supabase/supabase-js`) with AsyncStorage persistence.
- Editorial design tokens duplicated in `src/lib/colors.ts` — must stay in sync with `tailwind.config.js`.

## 3. Data model summary

See `app/supabase/migrations/0001_init.sql` for the canonical SQL. High-level:

```
organizations ──┬── org_members ── profiles ── auth.users
                ├── cases ─┬── case_events
                │          ├── treatments
                │          └── donations (sponsorships)
                ├── partners
                ├── vet_clinics
                ├── fosters
                ├── inventory
                ├── donation_products ── donations
                ├── donors
                ├── incoming_queue ── cases
                ├── training_modules ── training_completions ── profiles
                └── requests
species ─── (global) ─── cases.species_id
festival_alerts ─── (global)
```

**Single tenancy column: `org_id`.** Every domain row carries it. RLS gates all access via `my_org_ids()`. Global tables (species, festival_alerts) are read-only public.

## 4. Key request flows

### 4.1 Citizen reports an injured bird (native)

```
1. App → POST /rest/v1/cases     (anon JWT, reporter_anon=true)
2. Trigger: gen_short_id assigns AR-2487
3. Trigger: log_case_status_change writes case_events row
4. Realtime: cases channel fires → coordinator dashboards refresh
5. Edge Function send-push: notify on-shift coordinators
6. App → POST /storage/v1/object/case-photos/awcs/{id}/...jpg  (with the photo)
7. App navigates to /track/{id}, polls case status every 30s
```

### 4.2 Coordinator dispatches a volunteer

```
1. Coordinator opens Cases on web → clicks a case
2. PATCH /rest/v1/cases?id=eq.{id} { status: 'in-rescue', assigned_to: '{volunteer_id}' }
3. Trigger: log_case_status_change writes status-change event
4. Realtime: tracker on the reporter's app re-fetches
5. Edge Function send-push: volunteer gets "You've been assigned KR-2487"
```

### 4.3 Donor sponsors a bird

```
1. Donor opens /awcs/donate/sponsor on web
2. Selects a case → opens Razorpay checkout (₹2,000)
3. Razorpay calls our webhook on payment success
4. razorpay-webhook Edge Function:
   - verifies HMAC signature
   - updates donations row to paid
   - links donation to case (sponsor_id)
   - calls issue-80g-receipt
5. issue-80g-receipt:
   - generates PDF with donor PAN, org PAN, amount
   - uploads to Storage at receipts/{org_slug}/{receipt_no}.pdf
   - emails the donor
6. Donor sees confirmation; case_events gets a "sponsored" row
```

### 4.4 Auto-router escalates a non-bird case

```
1. WhatsApp message arrives: "cow stuck in road" → BSP webhook
2. import-whatsapp Edge Function classifies and inserts incoming_queue row
3. Coordinator accepts → creates case (kind=animal, problem=stuck)
4. Edge Function auto-route sees kind=animal + keywords match "cattle":
   - finds the cattle partner from partners table
   - sends them a WhatsApp template via BSP
   - writes case_events 'auto-routed' row
5. Coordinator dashboard shows "Handed off to Sri Krishna Goshala"
```

## 5. Decisions log

See individual D-001 through D-008 entries documented. Multi-tenancy via RLS; Supabase managed; React Native (Expo) for mobile; editorial design; English-only at launch; donors on web; Razorpay only; Edge Functions over microservices.

## 6. Non-functional requirements

| Concern | Target |
|---|---|
| Time-to-interactive on the team dashboard | < 1.5s on 4G phone |
| Time from "submit" to coordinator-sees-it (realtime) | < 2s |
| Page bundle size (initial) | < 250 KB gzipped for the public landing |
| Image upload p95 | < 8s on 4G |
| Read query p95 | < 200ms |
| Uptime SLO | 99.5% (NGO-acceptable; not banking-grade) |
| Recovery time objective (RTO) | < 4 hours |
| Recovery point objective (RPO) | < 24 hours |

## 7. Repository layout

```
karuna/
├── docs/                  # this folder — PRD, architecture, security, roadmap, funder pitch
├── app/                   # production web app (Vite + React + TS)
│   ├── src/
│   ├── supabase/migrations/
│   └── supabase/functions/   # Edge Functions (Deno)
├── app-mobile/            # Expo / React Native reporter app
│   ├── app/                  # expo-router file system
│   └── src/
├── scripts/               # one-shot provisioning + CI helpers
├── .github/workflows/     # CI
└── src/                   # legacy demo (kept for portfolio reference)
```
