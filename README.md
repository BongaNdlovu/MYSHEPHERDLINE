# MyShepherdLine

Expo + React Native + TypeScript **internal shepherd tool** for one congregation — visit logging, member care, and
follow-up tasks for provisioned staff. Not a public member portal. See
[docs/product-scope.md](docs/product-scope.md).

## Stack

- **Mobile:** Expo Router, React Native, TypeScript
- **Auth & data:** Supabase with RLS
- **API:** Cloudflare Workers (`worker/`)
- **Push:** Expo Push Notifications

## Setup

This repo uses **npm workspaces** for the Expo app (root) and the Cloudflare Worker (`worker/`).

```powershell
npm.cmd install
copy .env.example .env
```

Apply `supabase/schema.sql`, then deploy the worker:

```powershell
npm.cmd run deploy --workspace myshepherdline-worker
```

Set Worker secrets before deploy (from any directory):

```powershell
npx.cmd wrangler secret put SUPABASE_URL --config worker/wrangler.toml
npx.cmd wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config worker/wrangler.toml
npx.cmd wrangler secret put DIGEST_CRON_SECRET --config worker/wrangler.toml
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

Runs TypeScript, ESLint, lockfile/audit checks, app unit/integration tests, and Worker tests.

Optional live security gate (requires `.env` + real staging data in Supabase):

```powershell
npm.cmd run test:rls:live
```

Windows fallback if Vitest reports `spawn EPERM`:

```powershell
npm.cmd run verify:win
```

See [docs/testing/verify-pipeline.md](docs/testing/verify-pipeline.md).

## Android E2E (Maestro)

See [docs/testing/e2e-android.md](docs/testing/e2e-android.md).

```powershell
npm.cmd run test:e2e
```

## Security notes

- App fails fast when Supabase env vars are missing (no placeholder client in production mode).
- Supabase auth sessions persist via `expo-secure-store` on native (chunked for large payloads) and `localStorage`
  on web.
- RLS enforces role/assignment scoping and **blocks inactive users**; apply `supabase/schema.sql` on new projects or
  `supabase/security-hardening-migration.sql` on existing projects.
- New Auth users receive **inactive** profiles until the owner activates them in Admin → Users & Roles.
- Disable public signup in Supabase (see [docs/security/production-hardening.md](docs/security/production-hardening.md)).
- Admin Center is gated by `profile.role` (`admin` or `owner`) via `useAdminAccess()`. Set credentials only in Supabase
  Auth — never in app code or SQL.
- Worker `/notifications/send-digest` requires owner auth or `X-Cron-Secret`; sensitive actions emit structured audit
  logs with `X-Request-Id`.
- Worker rate limiting uses in-memory buckets in dev; bind a Cloudflare KV namespace as `RATE_LIMIT` for production.
- Worker reports are role-scoped for shepherds.
- Full production checklist: [docs/security/production-hardening.md](docs/security/production-hardening.md).

## Compliance

Operational POPIA/PAIA drafts: [docs/compliance/README.md](docs/compliance/README.md). In-app privacy/terms:
`features/legal/` (routed via `app/legal/`).

**Production requires** qualified counsel to complete
[docs/compliance/legal-review-signoff.md](docs/compliance/legal-review-signoff.md). Public visitor registration, prayer
requests, events/forms, and CSV export are **out of scope** for v1 — see
[docs/product-scope.md](docs/product-scope.md).

## Project layout

See [ARCHITECTURE.md](ARCHITECTURE.md) and [docs/README.md](docs/README.md). Quick map:

| Path | Purpose |
| --- | --- |
| `app/` | Expo Router URLs - thin re-exports only |
| `features/` | Business features (auth, account, home, members, tasks, reports, visits, legal, admin) |
| `lib/core/` | Env, Supabase, auth session, API, toast |
| `lib/app-shell/` | Shell behavior (auth redirect gate) |
| `components/ui/` | Shared UI primitives |
| `types/` | Backend/domain types |
| `worker/` | Cloudflare Worker API package |
| `__tests__/` | App unit/integration tests and fixtures |
| `docs/` | Documentation index |

**Where to add code:** new screens go in `features/<name>/screens/` and are exported from `features/<name>/index.ts`.
Routes in `app/` should only re-export them. Data fetching goes in feature `hooks/` -> `services/` -> Supabase/Worker.

## EAS

Project ID: `05bdcb19-5d5f-4d5b-bfaa-5f9c5483bfd4`

```powershell
npx.cmd eas-cli build --profile preview --platform android
```
