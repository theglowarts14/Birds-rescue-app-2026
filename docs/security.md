# Karuna · security & threat model

> What can go wrong, who can do it, what we do about it. Read before adding endpoints that touch money, PII, or partner contact data.

**Last updated:** 2026-05-17
**Status:** v0.1 · pre-pentest

---

## 1. Trust boundaries

Four clear tiers: anonymous public can only insert a case and read public landing; authenticated users can read/insert their own cases and donations; org members can read/write all rows for their org; owners alone can modify members.

Each row goes through **two checks**: HTTP-level (route guards, server-side auth on Edge Functions) and **row-level (Postgres RLS).** If both fail, the data leaks. So RLS is the final brick wall.

## 2. Threat model (STRIDE, abridged)

12 threats catalogued (T1–T12): spoofed reports, donor-row tampering, repudiation, cross-org info disclosure, donor PII leak, DoS on `/cases` insert, image-upload spam, privilege escalation, RLS bypass via SECURITY DEFINER misconfig, tracker URL guessing, secrets in repo, stale package vulns.

For each: surface, likelihood, impact, mitigation. See full table in repo source.

## 3. RLS strategy

### Principle
**Default deny. Allow narrowly.** Every table has `enable row level security`. Every policy is scoped via `my_org_ids()` (members) or `auth.uid() = id` (own row).

### Helper function
```sql
create or replace function my_org_ids() returns setof uuid
language sql stable security definer as $$
  select org_id from org_members where user_id = auth.uid();
$$;
```
- `security definer` so the function bypasses RLS on `org_members` (it would deadlock otherwise).
- Single source of "which orgs". Any check uses this; never reimplement.

### Policy patterns

**Per-org-members table (cases, donations, partners, ...):**
```sql
create policy "members read"  on T for select using (org_id in (select my_org_ids()));
create policy "members write" on T for all    using (org_id in (select my_org_ids()));
```

**Public-read table (donation_products, festival_alerts, species):**
```sql
create policy "public read" on T for select using (true);
create policy "members write" on T for all using (org_id in (select my_org_ids()));
```

**Own-row table (profiles, donors):**
```sql
create policy "own read"  on T for select using (id = auth.uid());
create policy "own write" on T for update using (id = auth.uid());
create policy "self insert" on T for insert with check (id = auth.uid());
```

**Insert-only by anon (incoming reports):**
```sql
create policy "anon report" on cases for insert with check (
  reporter_anon = true or reporter_id = auth.uid()
);
```

### What the pentest must verify

1. **Cross-org read** — log in as user from Org A, try to SELECT cases of Org B by id. Must return zero rows.
2. **Cross-org write** — same with UPDATE/DELETE. Must error.
3. **Anonymous read of cases** — without auth, hit /rest/v1/cases?id=eq.{any}. Must return zero rows.
4. **Donor reads stranger's donation** — zero rows.
5. **Member privilege escalation** — coordinator can't insert org_members with role='owner'.
6. **SECURITY DEFINER abuse** — verify my_org_ids() doesn't leak.
7. **JSONB injection** — case_events.payload is data-only; safe.

## 4. Secrets

| Secret | Where it lives |
|---|---|
| Supabase service-role key | Supabase Vault; never on client |
| Razorpay key_secret | Supabase Vault (for Edge Functions) |
| Razorpay webhook signing secret | Supabase Vault |
| Expo push access token | Supabase Vault |
| Sentry DSN (server) | Edge Function env |
| Sentry DSN (client) | Public — in client bundle by design |
| WhatsApp BSP credentials | Supabase Vault (when added) |

**Rule:** anything prefixed `EXPO_PUBLIC_*` or `VITE_*` is in the client bundle. **Never** put a service-role key, a webhook secret, or a payment key_secret in there.

## 5. Abuse mitigation

### Anonymous case spam
- Supabase project-wide rate limit: 60 req/min per IP for `/rest/v1/cases`.
- Edge Function `rate-limit-report` tracks per-phone-number + per-IP submissions; throttles after 5 in 10 minutes.
- CAPTCHA (Cloudflare Turnstile) on the web report form after 2 submissions/IP/day.
- Coordinator UI: one-click "block this reporter" flag.

### Donor card testing (carding)
- Razorpay's own fraud rules block most.
- Our webhook only accepts events signed by the Razorpay HMAC secret.
- We do not store card numbers.

### Photo upload abuse
- Storage policy enforces max object size 5MB.
- Server-side image transform on first read generates webp + thumbnails (later).
- ML safety filter on first upload, rejecting on confidence threshold (later).

## 6. PII handling

Reporter phone in `profiles.phone_e164` (org members only). Donor PAN/email in `donors` table (self + service-role only). Volunteer real-time location never persisted.

Per **DPDP Act 2023**:
- Data fiduciary = Karuna on behalf of the NGO.
- Purpose disclosed at collection.
- Edge Function `forget-me` (planned) handles deletion requests; cascades to profile/donors/reporter-set-null. Sponsorships remain (audit) but anonymized.

## 7. Logging + audit
- `case_events` = per-case append-only audit (built via trigger).
- Supabase logs → Logtail (planned).
- Sentry `beforeSend` redacts: phone numbers, PAN, email addresses, photo URLs.
- Supabase Pro daily snapshots; 30-day retention.

## 8. Incident response

| Severity | Definition | Response time |
|---|---|---|
| P0 | Data breach confirmed; live abuse; payment outage | < 1 hr |
| P1 | One NGO can't operate (login broken, reports failing) | < 4 hrs |
| P2 | Degraded but functional | < 24 hrs |
| P3 | Cosmetic, no operational impact | < 1 week |

**On-call:** v1 = the founder. Phase 2 = a real rotation. Status page at `status.karuna.app` (planned).

## 9. Pre-launch checklist

- [ ] All 12 STRIDE threats verified by pentest
- [ ] RLS tests in CI (`app/supabase/tests/*.sql`)
- [ ] Secret-scan passes on full repo history (gitleaks/trufflehog)
- [ ] Sentry PII scrubbing tested
- [ ] DPDP-compliant privacy notice on landing + report flow
- [ ] Terms of service + DPA template for NGOs
- [ ] Backup restore drill performed and timed
- [ ] Razorpay + 80G integration verified by AWCS' CA
- [ ] One-page incident runbook printed and pinned

## 10. Open security questions

1. Anonymous reporter tracker URL: UUID alone or HMAC token?
2. Photo retention: forever, or 1 year for non-released?
3. PAN: column encryption on top of at-rest DB encryption?
4. WhatsApp BSP webhook auth: depends on vendor (Meta vs Twilio vs Gupshup).
