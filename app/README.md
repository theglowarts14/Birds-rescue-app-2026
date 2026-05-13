# Karuna · production web app

> Multi-tenant SaaS for animal-rescue NGOs. Team dashboard ("Karuna ops") + donor portal ("Animal Warriors" et al).

Live URL pattern: `karuna.app/:orgSlug/team` and `karuna.app/:orgSlug/donate`.

This is the **production track** that replaces the in-memory demo in `../src/`. The demo stays on the branch as a visual reference.

## Stack

- **React 18 + Vite + TypeScript**
- **Tailwind CSS** with the editorial palette (paper/cream/ink + rust/moss/amber/sky)
- **React Router** for org-scoped URLs
- **TanStack Query** for server state + caching
- **Supabase** for Postgres + Auth (phone OTP + Google) + Storage + Realtime
- **Razorpay** for payments + auto 80G receipts (server-side webhook validates and issues PDF)
- **Zustand** for client-only state (later)

## Run locally

### 1. Spin up Supabase

```bash
cd app
npx supabase start
```

This boots a local Postgres + Auth + Storage + Studio at `http://localhost:54323`. Migrations in `supabase/migrations/` are applied automatically.

### 2. Configure env

```bash
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from `npx supabase status`.
```

### 3. Generate TS types from your DB (recommended once schema settles)

```bash
npm run db:types
```

### 4. Run the app

```bash
npm install
npm run dev
```

- `http://localhost:5173/` — landing
- `http://localhost:5173/login` — phone OTP / Google sign in
- `http://localhost:5173/awcs/donate` — Animal Warriors donor portal (white-labeled)
- `http://localhost:5173/awcs/team` — team ops dashboard

## Database

`supabase/migrations/`:

- `0001_init.sql` — full schema. 18 tables, RLS policies, helper view `cases_with_species`, `gen_short_id` trigger, status-change audit trigger, `my_org_ids()` security-definer function.
- `0002_seed_global.sql` — species, festival alerts, training modules (org-agnostic).
- `0003_seed_awcs.sql` — Animal Warriors as the reference NGO + donation product catalog + partners + clinics + inventory.

Run migration order matters. `db:reset` wipes everything and re-applies in order.

### Multi-tenancy in one sentence

Every domain row has `org_id`. RLS policies gate access via `my_org_ids()`, which reads the user's org memberships. The `:orgSlug` URL parameter loads the right org row and applies brand colours via CSS variable `--org-primary`.

## Repo layout

```
karuna/
├── src/                  # ORIGINAL in-memory demo (kept for portfolio reference)
├── app/                  # PRODUCTION web app (this folder)
│   ├── src/
│   │   ├── lib/          # supabase client, auth, org context, queries
│   │   ├── pages/        # routed pages, org-scoped under /:orgSlug
│   │   └── ...
│   └── supabase/
│       └── migrations/   # SQL — source of truth for the DB
```
