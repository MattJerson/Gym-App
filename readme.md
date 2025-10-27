# Gym App Monorepo Guide

A single repository for the mobile app (Expo/React Native), the admin dashboard (Vite/React), and the Supabase backend (SQL migrations + Edge Functions).

## Overview
- Mobile app: Expo (React Native) for iOS/Android/Web
- Admin dashboard: React + Vite
- Backend: Supabase (Postgres + RLS + PostgREST + Edge Functions)
- Data model: workout tracking, nutrition, social, gamification

## Architecture
- Clients
   - Mobile: `expo-router` app under repository root (entry: `expo-router/entry`)
   - Admin: `admin/` React app using Vite and `@supabase/supabase-js`
- Backend
   - Database migrations: `supabase/migrations/*.sql`
   - Edge Functions: `supabase/functions/*`
- Security
   - Row Level Security on all user data tables
   - Views favor `security_invoker` and avoid joining `auth.users` directly
   - Functions have pinned `search_path`
   - Client keys: Anon key only; service role never ships to clients

## Features
- User onboarding with persisted draft and hydration
- Workout sessions, exercise sets, personal records
- Nutrition: meals, plans, food database (with server-side proxy for external API)
- Social: posts, messages, reactions
- Gamification: badges, challenges, weekly leaderboards
- Admin: analytics, user overview, notifications

## Tech Stack
- Frontend: React Native (Expo), React (Vite), TypeScript-friendly
- Backend: Supabase (Postgres, RLS, PostgREST, Edge Functions – Deno)
- Storage: AsyncStorage (mobile); optional secure storage adapter
- Tooling: NPM/Expo; SQL migrations in repo

---

## Getting Started

### Prerequisites
- Node.js LTS and a package manager (npm/yarn/pnpm)
- Expo CLI (`npx expo`)
- A Supabase project (URL + anon key; service role kept server-side only)
- **For iOS development:**
  - Xcode (macOS only)
  - CocoaPods (`sudo gem install cocoapods`)

### Team Setup (First Time Clone)

If you're a teammate cloning this repo for the first time, follow these steps:

```bash
# 1. Clone the repository
git clone https://github.com/MattJerson/Gym-App.git
cd Gym-App

# 2. Install JavaScript dependencies
npm install

# 3. Install iOS native dependencies (required for iOS development)
cd ios && pod install && cd ..
# Alternative: npx pod-install

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials (ask team lead)

# 5. Start the development server
npm start
```

**Important Notes:**
- The `ios/` folder contains essential config files but **NOT** the `Pods/` directory
- You must run `pod install` to download iOS native dependencies locally
- `node_modules/` and `ios/Pods/` are regenerated on your machine (not in git)
- For features like HealthKit, you'll need a development build (not Expo Go)

### Environment Variables
Create a `.env` for the mobile app (loaded via `react-native-dotenv`):

```
# Mobile (Expo)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Create `admin/.env` for the admin site (Vite variables):

```
# Admin (Vite)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
# Do NOT set VITE_SUPABASE_SERVICE_ROLE_KEY in client envs
```

If using the FoodData proxy Edge Function, store its upstream secret in Supabase secrets (not in the repo):
- In Supabase: `supabase functions secrets set FOODDATA_API_KEY=your_usda_key`

### Install
- Root/mobile app (monorepo root): install dependencies, then start the Expo dev server
- Admin app: `cd admin` → install → dev server

Tip: Start Expo with `npm start` (or `npx expo start`). Do not run `npm expo start`.

### Run
- Mobile (from repo root): `npm start` then choose iOS/Android/Web
- Admin (from `admin/`): `npm run dev`

---

## Supabase: Database & Functions

### Migrations
- SQL migrations live in `supabase/migrations/`
- Notable files:
   - `999_security_fixes.sql`: security hardening (views, `security_invoker`, `search_path`, enriched views)
   - `010_performance_indexes.sql`: covering indexes for unindexed foreign keys
   - `012_composite_policy_indexes.sql`: composite indexes for common query/RLS patterns
   - `011_optional_index_maintenance.sql`: commented DBA guidance for pruning unused indexes

How to apply:
- Use Supabase Studio SQL editor (paste/run) or your preferred migration runner
- Migrations are additive and idempotent (use `IF NOT EXISTS` and guards)

### Edge Functions
- Example: `supabase/functions/fooddata_proxy/index.ts`
   - Proxies external FoodData API server-side
   - Input validation, per-IP rate limiting, and CORS
   - Requires `FOODDATA_API_KEY` secret set in the project

---

## Security
- RLS enforced; clients use anon key only
- Admin dashboard authorized via user session + RLS (no service role on client)
- Views set to `security_invoker` where possible; avoid exposing `auth.users`
- Functions have pinned `search_path` (`pg_catalog, public`)
- Admin idle-timeout sign-out implemented
- Edge proxy holds sensitive external API keys

Rules of thumb
- Never embed the service role key in the mobile or admin bundle
- Rotate keys periodically; use project secrets and environment variables
- Prefer secure storage for tokens on device (see Token Storage)

### Token Storage
- Mobile uses `AsyncStorage` by default; for stronger security switch to a secure storage adapter (Keychain/Keystore via Expo SecureStore) that implements `getItem/setItem/removeItem` and pass it to `createClient` as `auth.storage`

---

## Performance
- Foreign key covering indexes: `010_performance_indexes.sql`
- Composite query indexes: `012_composite_policy_indexes.sql`
- DBA notes: `DB_PERFORMANCE_PLAYBOOK.md` and optional `011_optional_index_maintenance.sql`
- Admin queries prefer enriched read-only views to avoid deep PostgREST embeds

---

## Admin Dashboard Data Sources
- Use RPCs or enriched views:
   - `user_subscriptions_enriched`
   - `user_stats_enriched`
   - `workout_logs_enriched`
   - `safe_weekly_leaderboard` for public leaderboard

These avoid direct joins to `auth.users` and align with RLS.

---

## Troubleshooting

Refresh token not found (mobile)
- Ensure `auth.storage` is set (AsyncStorage or secure adapter)
- Confirm env vars resolve at runtime (log `SUPABASE_URL`/`SUPABASE_ANON_KEY` once)
- Enable `auth.debug: true` temporarily to observe refresh behavior
- Inspect AsyncStorage for a session key that includes a `refresh_token`
- If missing/expired, prompt re-authentication; review Supabase Auth rotation/expiry

Expo start fails
- Use `npm start` or `npx expo start` from the repo root
- Do not run `npm expo start`

SQL migration errors (relation does not exist)
- Use guarded migrations (as in `012_composite_policy_indexes.sql`) that check table/column existence
- If live table names differ (e.g., `channel_messages` vs `chat_messages`), keep both guarded branches

Advisor warnings
- Many `auth_rls_init_plan_*` and `multiple_permissive_policies_*` messages are informational
- Focus on real query performance and security; the index migrations address planner needs

---

## Deployment (high level)
- Mobile: EAS Build/Submit (configure app.json/app.config and env for runtime)
- Admin: Vite build → host static assets (Netlify/Vercel/S3 + CDN)
- Backend: SQL migrations applied in Supabase; Edge Functions deployed via Supabase CLI/Studio

---

## Roadmap / Future Improvements
- Migrate mobile auth tokens to secure storage adapter
- Enable monitoring/alerts: p95 latency, error rates, and Sentry (PII-scrubbed)
- Add read replica for analytics-heavy pages if needed
- Apply CI security tooling: Secret scanning, Dependabot, CodeQL
- Load testing (k6/Gatling) for key user journeys
- Consider partitioning high-churn tables if growth demands it (e.g., logs)

---

## Key Paths
- Mobile Supabase client: `services/supabase.js`
- Admin Supabase client: `admin/src/lib/supabase.js`
- Performance migrations: `supabase/migrations/010_*.sql`, `012_*.sql`
- Security hardening: `supabase/migrations/999_security_fixes.sql`
- Edge function (FoodData proxy): `supabase/functions/fooddata_proxy/index.ts`

## License
Internal project. Do not distribute keys or credentials.