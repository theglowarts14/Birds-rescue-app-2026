# Karuna · 6-month roadmap

> Month-by-month plan from "branch with code" to "AWCS in Hyderabad live + 3 more NGOs onboarding."

**Last updated:** 2026-05-17
**Funding assumption:** grant secured by end of Month 1, or self-funded bridge for first 2 months.

---

## Month 1 · M1 · "Make it real"

**Theme:** Stop writing speculative code. Turn the branch into a working deployment a real person can use.

- W1 — Provision real Supabase project; run migrations; create `case-photos` Storage bucket; seed AWCS
- W1 — Vercel deployment of `app/`; custom domain `karuna.app`
- W2 — Razorpay merchant account in AWCS' name; test mode webhook → Edge Function flow
- W2 — `razorpay-webhook` Edge Function + `issue-80g-receipt` PDF generation
- W3 — Sentry + Logtail wired for web + native + Edge Functions
- W3 — Auth E2E: phone OTP works, Google OAuth callback works, RLS verified with two seeded users
- W4 — First real test rescue: someone reports a fake bird from the live app; AWCS coordinator sees it; status flows
- W4 — Funder pitch deck + the auto-generated impact poster as a sample artifact

**M1 success:** AWCS coordinator can dispatch a case from her phone. A test donor can give ₹500 and get a real 80G PDF in email.

---

## Month 2 · M2 · "Battle harden"

**Theme:** Everything that worked in M1, but reliable, fast, secure, and observable.

- W1 — RLS pentest by an external consultant; fix every finding
- W1 — Rate limiting on anonymous report + WhatsApp ingest
- W2 — Realtime subscriptions wired on coordinator Overview; new-case toast
- W2 — Image upload to Storage with progress bar + retry on flaky network
- W3 — Push notifications: Expo device-token registration in native; `send-push` Edge Function fires on case events
- W3 — CI pipeline: typecheck + build + supabase-cli schema diff on every PR
- W4 — RN app store builds: TestFlight beta and Android internal-testing track
- W4 — AWCS team training day — onboard 6 volunteers, 2 coordinators on the live app

**M2 success:** AWCS uses Karuna for every new rescue. No more paper notebooks. Push notifications work. Reports are tamper-proof.

---

## Month 3 · M3 · "First real donor"

**Theme:** Donor portal is live. Real money flows. Recurring donors start to convert.

- W1 — Public launch of `karuna.app/awcs/donate`
- W1 — "Give a thing" product cards working with Razorpay live mode
- W2 — Sponsor-a-case flow: donor picks a case, ₹2,000 payment, immediate email confirmation
- W2 — Weekly email job: every sponsor gets a status update with photo
- W3 — Recurring donations (monthly bird fund) via Razorpay subscriptions
- W3 — Released feed live; release events trigger sky-blue feed update + sponsor notification
- W4 — First impact poster auto-generated for May 2026
- W4 — Recognition wall opt-in flow live

**M3 success:** First 50 paying donors. First 5 monthly recurring. ₹1 lakh in donations processed in M3.

---

## Month 4 · M4 · "Tell the story"

**Theme:** Karuna becomes the showcase for AWCS' work; case studies, press, funder narratives.

- W1 — CSR portal live with intake form + first 3 pilot conversations with companies
- W1 — First fully-auto-generated grant template (Azim Premji) submitted with AWCS' live numbers
- W2 — Volunteer training modules content authored (8 modules; total ~70 mins)
- W2 — Dispatch-gating turned on
- W3 — Heatmap and audit features battle-tested in funder demos
- W3 — One profile feature done well: featured release of the month
- W4 — First case study published: "AWCS reduced time-to-dispatch from 12 min to 3.5 min"

**M4 success:** First grant application submitted via Karuna's templates. First corporate CSR conversation booked.

---

## Month 5 · M5 · "Multi-tenant proof"

**Theme:** Onboard NGO #2 in a different city.

- W1 — Identify partner NGO in Bangalore or Mumbai
- W1 — New onboarding wizard run live with their founder; < 20 minutes start to finish
- W2 — Org-aware branding shipped
- W2 — First case dispatched from NGO #2; cross-org isolation verified in production
- W3 — Telugu UI translation begins
- W3 — First WhatsApp BSP integration spike
- W4 — Auto-router: cattle and wildlife cases auto-escalate

**M5 success:** Two NGOs running on one Karuna. Zero data leaks between them. Telugu UI in alpha.

---

## Month 6 · M6 · "Sustainable"

**Theme:** Karuna is a known thing. Funders return calls.

- W1 — Two more NGOs onboarded (Delhi + Mumbai or BLR + CCU)
- W1 — Telugu UI live for AWCS reporters; Hindi in test for Delhi
- W2 — WhatsApp BSP integration live for AWCS
- W2 — First quarterly impact report (Q1) sent to all donors
- W3 — First major grant (₹15-50 lakhs) approved or in final review
- W3 — First hire (designer or backend engineer) onboarded
- W4 — Karuna is open-source: "free for verified NGOs, paid for commercial"
- W4 — One-page status page at status.karuna.app; SLO published

**M6 success:** Four NGOs live. 500+ donors. ₹10 lakh+ donations processed. First grant secured.

---

## Cross-month commitments

### Weekly
- Demo to AWCS Friday afternoon
- Update `docs/` if PRD/architecture changed
- Sentry triage: P0/P1 fixed within SLA

### Monthly
- Post-mortem on any P0/P1 incidents
- Karuna's monthly impact metrics emailed to grantors
- Office hours: one open Zoom for NGOs interested in adopting

### Per release
- Migration files reviewed; rollback drill on staging
- Performance regression check (Lighthouse on web, Flipper on native)
- One usability test with a non-tech reporter

## Out of scope for 6 months

- iOS/Android tablet UI
- Open public API
- Volunteer-to-volunteer chat
- AI-suggested next-action
- Donor matchmaking
- Merch store / pet adoption portal
- Pan-India open self-serve NGO onboarding

These show up in **months 7-12** if M6 lands.

## Definitions of done

A milestone is "done" when **all** of:
1. Code merged to `main`, deployed to production
2. Documentation updated
3. Tested on a real device + real network by a non-builder
4. Sentry has zero P0/P1 open for the area
5. AWCS coordinator has acknowledged the change in writing

## Backstop

If a month slips by > 2 weeks: stop, write a short retro, replan the rest. Don't push features into "the next month" silently. **Honesty with the funder is the moat.**
