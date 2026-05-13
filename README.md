# Karuna · Animal Warriors

> When wings fall, we answer.

Karuna is the digital rescue platform built for **Animal Warriors Conservation Society** (AWCS) — a 24×7 bird & wildlife rescue NGO based in Hyderabad, Telangana, founded 2019. The platform serves three audiences in one app: the **public** who reports rescues, the **team and volunteers** who handle them, and the **donors** who fund them.

Helpline · **+91 96978 87888** (WhatsApp) · awcsindia.org

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## What's inside

A single React component (`src/App.jsx`) with three pre-populated views:

- **Public Landing** — Reporter flow, 3-tap smart triage, "do this / don't do that" cards, live status tracker, species guide, festival alerts (Sankranti, May heat, monsoon, Diwali), school & RWA workshop booking, building safety audit, volunteer signup, foster registry, regional WhatsApp groups.
- **Team Dashboard** — Sidebar ops nav, color-coded urgency board, GPS auto-assignment, partner-NGO router (PFA Telangana, goshala network, DRF, Forest Dept), photo-based handovers, treatment & recovery logs, volunteer roster (on-duty / in-field / on-call / off-duty), rescue heatmap by area, inventory tracking, vet clinic network, audit trail, auto-generated monthly impact poster, volunteer training, pre-filled grant templates.
- **Donor Portal** — Product-based giving (₹150 water bowl → ₹5,000 wildlife rescue), sponsor-a-specific-case with photo updates, monthly auto-donate, Instagram-style impact feed, auto 80G receipt preview, CSR portal, donor recognition wall, QR code generator for offline events.

Newly submitted reports propagate to all three views in real time.

## MVP scaffolding

This is an MVP intended for real deployment, not a throwaway demo. The seams for the real backend are already in place:

- **`src/api.js`** — typed-stub API client. Every endpoint your server will need is sketched here (`cases`, `volunteers`, `donors`, `whatsapp`, `helpline`, `impact`). Wire it up to your backend (Supabase / Firebase / Node + Postgres / Django — anything that speaks JSON).
- **`.env.example`** — `VITE_API_BASE`, helpline E.164, Razorpay key, Sentry DSN. Copy to `.env.local`.
- **Sample data banner** — every page shows a dismissible amber strip reminding you that names, cases, donations and stats are illustrative. Replace the constants at the top of `src/App.jsx` (`INITIAL_CASES`, `TEAM`, `PARTNERS`, `VET_CLINICS`, etc.) with real data once the backend is wired.
- **Auth seam** — `authHeaders()` in `src/api.js`. Slot in your JWT / session provider; gate `/team` and the donor admin behind it.

## Stack

- React 18 + Vite 5
- lucide-react icons
- Fraunces (display) · Inter (body) · JetBrains Mono (case IDs)
- Inline styles · in-memory state. No localStorage. No backend (yet).
- ~258 KB JS bundle (74 KB gzipped). 1500-ish modules.

## Brand

- Public-facing: **Animal Warriors** (the NGO's public-facing identity)
- Internal ops (Team Dashboard): **Karuna** (the platform name)

## Tone

Warm, urgent, human. Every line is written like it was typed at 2 AM by someone who has just picked up an injured bird. No corporate jargon, no startup-speak, no overly clinical medical terms in the public copy. Hero line: *"When wings fall, we answer."*

## License

Internal — AWCS / Animal Warriors. Contact the team before redistribution.
