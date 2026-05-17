# Karuna · PRD v0.1

> Multi-tenant SaaS for animal-rescue NGOs in India. Web ops + donor portals + native reporter app + WhatsApp-first helpline. Hyderabad first, AWCS as reference NGO. Grant-funded; free for NGOs.

**Owner:** [you]
**Status:** Draft · pre-funding
**Last updated:** 2026-05-17

---

## 1. Problem

Indian animal-rescue NGOs run on WhatsApp, paper notebooks, and personal phones. The result:

- **Critical minutes lost** triaging incoming calls (no inbox, no urgency tagging, no auto-routing).
- **Cases get dropped** because no one tracks status from intake → release; reporters never hear back.
- **Donor trust erodes** — donors get a thank-you-WhatsApp, never see the bird they funded.
- **Volunteers burn out** on undifferentiated work; no roster, no shift visibility, no training gating.
- **NGOs can't get bigger grants** because they can't show audited numbers, recurring impact, or a tech moat.

Hyderabad's **Animal Warriors** (AWCS) handles ~2,000 cases/year on this stack. They are at the edge of what's possible without software.

## 2. Users

| Persona | Surface | What they do |
|---|---|---|
| **Reporter** (citizen) | Native app + WhatsApp + 1800-line | Spots a bird in distress, sends location + photo, follows the rescue |
| **Coordinator** (NGO ops) | Web team ops on desktop + phone | Triages incoming, dispatches volunteers, tracks every case end-to-end |
| **Field rescuer / vet / foster** | Native app + web on phone | Accepts dispatches, logs treatment, marks status, snaps recovery photos |
| **Donor** (individual) | Web (mobile and desktop) | Picks a "thing" to fund, sponsors a bird, gets photo updates, downloads 80G |
| **CSR contact** (corporate) | Web | Bulk donations, branded quarterly reports, employee volunteering |
| **NGO admin** | Web admin | Org settings, team invites, brand colors, helpline routing |
| **Funder** (grants officer) | Web export + PDFs | Reviews audited spend ledger, impact PDFs, recurring donations |

## 3. Scope · v1 (first 6 months)

### In scope

**Reporter:**
- 4-tap rescue submission (kind → problem → urgency → photo + GPS + note)
- Anonymous-by-default; sign-in only to track your own reports
- Status tracker per case with editorial copy
- Field guide (species + first aid) and active festival alerts
- Push notifications when a case you reported changes status

**Team ops (Karuna):**
- Overview command center (KPIs, critical-now, incoming queue)
- Cases board (filterable, searchable, drill-in)
- Case detail with timeline, treatment log, status advance
- Volunteer roster with shift status
- Auto-router target list (partners + flag-only)
- Vet clinic directory
- Inventory with low-stock alerts
- Heatmap (area density)
- Training modules with dispatch-gating
- Append-only audit feed
- Auto-generated monthly impact poster
- Pre-filled grant templates with live numbers

**Donor portal (per-NGO white-label):**
- Product catalog (₹150 bowl → ₹5,000 wildlife rescue)
- Sponsor a specific in-care case
- Sky-blue release feed
- Recognition wall (opt-in)
- CSR landing with intake form
- 80G receipt auto-issued by Razorpay

**Admin:**
- 3-step NGO onboarding wizard
- Org settings (name, tagline, helpline, brand color)
- Team invites by phone (OTP)

**Platform:**
- Multi-tenant Postgres with RLS on every row
- Phone OTP + Google sign-in (Supabase Auth)
- Realtime live updates on the coordinator dashboard
- Photo storage in Supabase Storage (org-prefixed)
- Razorpay payments + 80G PDF generation (Supabase Edge Functions)
- Push notifications via Expo Push
- Hyderabad-first, AWCS-only at launch

### Out of scope (v1)

- Donor native app — donors stay on web
- AI auto-triage of WhatsApp messages beyond rule-based keywords
- WhatsApp business API two-way bot (manual coordinator triage v1)
- Multi-language UI (English only at launch; Telugu + Hindi phase 2)
- Pan-India open onboarding (NGOs onboarded manually for the first year)
- Volunteer-to-volunteer messaging
- E-commerce / merch
- Public API for third-party integrations

### Non-goals

- Replacing the helpline phone number — Karuna **augments** the phone, doesn't replace it.
- Donor matchmaking / dating-app-style sponsorship UX.
- Being a CRM for animal-rescue NGOs — we are an ops platform, not a Salesforce.
- Becoming a marketplace for vets, fosters, or cattle goshalas.

## 4. Success metrics (12-month targets)

| Metric | Baseline (AWCS today) | Target (12mo) |
|---|---|---|
| Time to first dispatch on a critical case | ~12 min (WhatsApp) | < 4 min |
| Cases dropped without status update | ~18% | < 5% |
| Reporter sees a status update | 0% | 100% |
| Donations w/ 80G PDF issued automatically | 0 | 100% |
| Recurring monthly donors | ~12 | > 200 |
| NGOs onboarded | 1 (AWCS) | 4 (HYD + BLR + DEL + MUM) |
| Cases handled total (across all NGOs) | 2,000 | 12,000 |
| Grant funding raised via auto-filled templates | ₹0 | ≥ ₹50 lakhs |
| Volunteer dispatch acceptance rate | ~62% | > 80% |

## 5. Constraints

- **Budget:** grant-funded (NGO Box, Azim Premji, EkStep, Tata Trusts targets). NGOs pay nothing.
- **Team:** 1 builder + (probably) 1 designer eventually + AWCS as design partner.
- **India-specific:** ₹/INR, +91 phone, 80G compliance, Razorpay only, Hindi/Telugu future, monsoon network reliability.
- **Trust:** NGOs are conservative. They've been burned by tech that didn't ship. **A "v1 that works" beats a "v2 that's beautiful."**

## 6. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AWCS doesn't adopt | Medium | Catastrophic | Build with them, not for them. Weekly demos. Co-author the schema. |
| Anonymous case spam | High | High | Rate-limit by IP + WhatsApp number. CAPTCHA on web report. Coordinator can flag + block. |
| 80G PDF errors | Medium | High | Razorpay-issued first; we mirror for archive. Auditor reviews template. |
| RLS bypass | Low | Catastrophic | Schema-level RLS, never client-side filtering. Pentest before launch. |
| Supabase free tier limits | Medium | Medium | Plan upgrade triggers at 50k MAU / 500GB storage. |
| Donor retention | High | High | Sky-blue release feed + named birds. Photo updates. Make every donation a story. |

## 7. Open questions

1. Do we accept anonymous reports from logged-out web users at launch, or require minimal sign-in?
2. Telugu UI — fully translated or English-with-Telugu-strings-for-key-CTAs?
3. Volunteer dispatch — push notification + 60s accept window? Or coordinator manually assigns?
4. Donor sponsorship matching — coordinator chooses, or first-come-first-served?
5. Pricing for additional NGOs beyond Hyderabad — free always, or transition to subscription after seed?

## 8. Appendix · related docs

- `architecture.md` — system + data design
- `security.md` — threat model + RLS strategy
- `roadmap-6mo.md` — phased delivery
- `funder-pitch.md` — narrative for grant applications
- `app/supabase/migrations/` — source-of-truth schema
