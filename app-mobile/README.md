# Karuna mobile · reporter app

> Expo / React Native. Phone-first rescue reporting + status tracking + field guide. Same Supabase backend as the web app.

The reporter app is the **first surface most users meet Karuna through** — a person on the road, spotting a bird in distress, opening this app, hitting four taps, and getting on with their day knowing a real human is en route.

## Stack

- **Expo SDK 51** + **React Native 0.74** with the new architecture
- **expo-router** (file-system routing)
- **TypeScript** strict mode
- **Supabase** for auth (phone OTP), data, storage, realtime
- **TanStack Query** for caching + auto-refetch on the tracker screen
- **expo-camera + expo-image-picker** for rescue photos
- **expo-location** for GPS pin-drop with reverse geocoding
- **expo-notifications** for push (sponsorship updates, case milestones)
- Editorial type system: **Fraunces** (display) + **Inter** (sans), via `@expo-google-fonts`

## Screens

| Tab        | Path                       | Purpose                                                                  |
|------------|----------------------------|--------------------------------------------------------------------------|
| Report     | `app/(tabs)/index.tsx`     | 4-step flow: kind → problem → urgency → photo + area + note → submit     |
| My reports | `app/(tabs)/my-reports.tsx`| Live list of cases you reported, tap into the tracker                    |
| Field guide| `app/(tabs)/guide.tsx`     | Active festival alerts + species cards with first aid                    |
| Profile    | `app/(tabs)/profile.tsx`   | Phone-OTP sign-in, quick actions (call, WhatsApp, donate, language)      |

Plus a modal-ish stack screen:

| Route                | File                  | Purpose                                                        |
|----------------------|-----------------------|----------------------------------------------------------------|
| `/track/[id]`        | `app/track/[id].tsx`  | Status of a specific case with editorial copy and 30s refetch  |

## Setup

```bash
cd app-mobile
npm install
cp .env.example .env.local
# fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY

npx expo start
# press i for iOS sim, a for Android emulator, or scan the QR with Expo Go
```

You'll need the **same Supabase project** as the web app — the schema and RLS policies in `../app/supabase/migrations/` are the contract this app talks to.

### Supabase Storage bucket

The reporter uploads photos to a public bucket called `case-photos`. Create it once (Supabase dashboard → Storage → New bucket → Public, name `case-photos`).

## What's wired vs. what's stubbed

**Wired:**
- 4-step report flow with haptics + progress bar
- Camera capture / library pick / GPS lookup with reverse geocoding
- `cases` insert via Supabase, with org_id from `awcs` (or `EXPO_PUBLIC_DEFAULT_ORG`)
- Phone-OTP sign-in via Supabase Auth
- Realtime-ish tracker (30s polling) for case status with editorial narrative copy
- Field guide pulling `species` + active `festival_alerts` from the global tables
- Quick actions: tel:, wa.me, donate URL

**Stubbed / TODO:**
- Push notifications — `expo-notifications` is installed but the device-token registration + Supabase Edge Function that sends them isn't wired.
- Language switcher — Telugu + Hindi planned for phase 2.
- Offline queue — if a report is composed without connectivity, stash it and retry.
- Donor flow — donors live on web (per the direction); this app intentionally stays as a reporter / volunteer surface.
- Photo upload to Supabase Storage — currently fires on submit but failures are silent.

## File tree

```
app-mobile/
├── app.json                 # Expo config + plugin permissions
├── package.json
├── babel.config.js
├── tsconfig.json
├── .env.example
├── app/                     # expo-router routes (file-system based)
│   ├── _layout.tsx          # root: fonts, query client, safe-area
│   ├── (tabs)/
│   │   ├── _layout.tsx      # bottom tabs
│   │   ├── index.tsx        # Report (4 steps)
│   │   ├── my-reports.tsx
│   │   ├── guide.tsx
│   │   └── profile.tsx
│   └── track/
│       └── [id].tsx         # Tracker for a specific case
└── src/
    ├── components/UI.tsx    # Display / Body / Kicker / Card / buttons
    └── lib/
        ├── colors.ts        # design tokens
        ├── supabase.ts      # typed client + AsyncStorage persistence
        └── queries.ts       # mobile-relevant subset of web queries
```
