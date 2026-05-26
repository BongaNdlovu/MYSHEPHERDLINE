# Documentation

Entry point for MyShepherdLine project docs. Start here if you are onboarding or looking for a specific guide.

## Start here

| Topic | Location |
| --- | --- |
| Architecture and code layout | [../ARCHITECTURE.md](../ARCHITECTURE.md) (includes error-handling ownership) |
| Local setup and scripts | [../README.md](../README.md) |
| Testing (unit, integration, E2E) | [testing/e2e-android.md](testing/e2e-android.md), [testing/verify-pipeline.md](testing/verify-pipeline.md) |
| Production security hardening | [security/production-hardening.md](security/production-hardening.md) |
| **Step-by-step setup (start here)** | **[setup/step-by-step.md](setup/step-by-step.md)** |
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
- **Business features:** `features/` (auth, account, home, members, tasks, reports, visits, legal, admin)
- **App shell:** `lib/app-shell/` (auth redirect), `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- **Shared infra:** `lib/core/` (env, Supabase, auth session, API, toast, errors, validation)
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

On Windows, if Vitest fails with `spawn EPERM`, use `npm.cmd run verify:win` — see [testing/verify-pipeline.md](testing/verify-pipeline.md).

## Deployment checklist

See [security/production-hardening.md](security/production-hardening.md) for the full production sign-off list. Summary:

1. **New Supabase project:** apply `supabase/schema.sql`, then `supabase/bootstrap-owner.sql`.
   **Existing project:** apply `supabase/fix-rls-security.sql`, then `supabase/admin-access.sql`.
   Run `supabase/verify-null-assignments.sql` before production cutover.
2. Set `.env` from `.env.example` (Supabase URL and publishable key; optional Worker URL).
3. Deploy Worker secrets, optional KV rate-limit namespace, and run `npm run deploy --workspace myshepherdline-worker`.
4. Run `npm.cmd run verify` (or `verify:win` on Windows if needed).
5. Run Android E2E smoke when Maestro and a preview build are available.
6. Build the app with EAS when ready (`README.md` EAS section).
