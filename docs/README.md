# Documentation

Entry point for MyShepherdLine project docs. Start here if you are onboarding or looking for a specific guide.

## Start here

| Topic | Location |
| --- | --- |
| Architecture and code layout | [../ARCHITECTURE.md](../ARCHITECTURE.md) |
| Local setup and scripts | [../README.md](../README.md) |
| Testing (unit, integration, E2E) | [testing/e2e-android.md](testing/e2e-android.md) |
| POPIA / compliance drafts | [compliance/README.md](compliance/README.md) |
| Worker deployment | [../README.md#setup](../README.md) (Setup section) |

## Repository packages

This repo contains two npm packages managed as workspaces:

| Package | Path | Purpose |
| --- | --- | --- |
| `myshepherdline` | repo root | Expo mobile app |
| `myshepherdline-worker` | `worker/` | Cloudflare Worker API |

Install once from the repo root:

```powershell
npm.cmd install
```

## Where code lives

- **Routes:** `app/` (thin re-exports only)
- **Business features:** `features/` (auth, account, home, members, tasks, reports, visits, legal)
- **App shell:** `lib/app-shell/` (auth redirect), `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- **Shared infra:** `lib/core/` (env, Supabase, auth session, API, toast)
- **Shared UI:** `components/ui/`
- **Types:** `types/`

Import features through their barrel files when possible:

```ts
import { useMembers, MembersScreen } from '@/features/members';
import { MoreScreen } from '@/features/account';
```

## Testing docs

- **App unit/integration tests:** `__tests__/` at repo root (cross-cutting config, security, domain selectors)
- **Worker unit tests:** co-located under `worker/src/__tests__/`
- **Android E2E:** `.maestro/flows/` - see [testing/e2e-android.md](testing/e2e-android.md)

Run everything:

```powershell
npm.cmd run verify
```

## Compliance docs

Operational POPIA/PAIA working documents are under [compliance/](compliance/). These are drafts and require legal review before production launch.

## Deployment checklist

1. Apply `supabase/schema.sql` to your Supabase project.
2. Set `.env` from `.env.example` (Supabase URL and publishable key; optional Worker URL).
3. Deploy Worker secrets and run `npm run deploy --workspace myshepherdline-worker`.
4. Build the app with EAS when ready (`README.md` EAS section).
