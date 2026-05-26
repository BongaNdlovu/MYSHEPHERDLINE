# MyShepherdLine

Expo + React Native + TypeScript app for congregation shepherding.

## Stack

- **Mobile:** Expo Router, React Native, TypeScript
- **Auth & data:** Supabase with RLS
- **API:** Cloudflare Workers (`worker/`)
- **Push:** Expo Push Notifications

## Setup

```powershell
npm.cmd install
copy .env.example .env
```

Apply `supabase/schema.sql`, then deploy the worker:

```powershell
cd worker
npm.cmd install
npx.cmd wrangler secret put SUPABASE_URL
npx.cmd wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx.cmd wrangler secret put DIGEST_CRON_SECRET
npm.cmd run deploy
```

Set `EXPO_PUBLIC_WORKER_API_URL` in `.env` to your `*.workers.dev` URL.

## Run

```powershell
npm.cmd start
npm.cmd run android
```

## Quality gates

```powershell
npm.cmd run verify
```

Runs TypeScript, ESLint, app unit/integration tests, and Worker tests.

## Android E2E (Maestro)

See [docs/testing/e2e-android.md](docs/testing/e2e-android.md).

```powershell
npm.cmd run test:e2e
```

## Security notes

- App fails fast when Supabase env vars are missing (no placeholder client in production mode).
- Worker `/notifications/send-digest` requires admin auth or `X-Cron-Secret`.
- Worker reports are role-scoped for shepherds.
- Demo data is test-only under `__tests__/fixtures/`.

## Compliance

Operational POPIA/PAIA drafts live in `docs/compliance/`. In-app privacy/terms screens are under `features/legal/` (routed via `app/legal/`). Legal review is required before production launch.

## Project layout

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full guide. Quick map:

| Path | Purpose |
|---|---|
| `app/` | Expo Router URLs — thin re-exports only |
| `features/` | Business features (auth, members, tasks, reports, visits, legal, home) |
| `components/ui/` | Shared UI primitives |
| `lib/core/` | Env, Supabase, auth, API, toast |
| `types/` | Backend/domain types |
| `worker/` | Cloudflare Worker API |
| `__tests__/` | Unit/integration tests and fixtures |

**Where to add code:** new screens go in `features/<name>/screens/`; routes in `app/` should only re-export them. Data fetching goes in feature `hooks/` → `services/` → Supabase/Worker.

## EAS

Project ID: `05bdcb19-5d5f-4d5b-bfaa-5f9c5483bfd4`

```powershell
npx.cmd eas-cli build --profile preview --platform android
```
