# Documentation

Entry point for MyShepherdLine project docs. Start here if you are onboarding or looking for a specific guide.

## Start here

| Topic | Location |
| --- | --- |
| **Product scope (internal tool, out-of-scope flows)** | **[product-scope.md](product-scope.md)** |
| Architecture and code layout | [../ARCHITECTURE.md](../ARCHITECTURE.md) |
| Local setup and scripts | [../README.md](../README.md) |
| Testing (unit, integration, E2E) | [testing/e2e-android.md](testing/e2e-android.md), [testing/verify-pipeline.md](testing/verify-pipeline.md) |
| Capacity / 5k-user readiness | [testing/capacity-plan.md](testing/capacity-plan.md) |
| Production security hardening | [security/production-hardening.md](security/production-hardening.md) |
| **Step-by-step setup** | [setup/step-by-step.md](setup/step-by-step.md) |
| POPIA / compliance | [compliance/README.md](compliance/README.md) |
| Legal sign-off (before launch) | [compliance/legal-review-signoff.md](compliance/legal-review-signoff.md) |
| Worker deployment | [../README.md](../README.md) (Setup section) |

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

- **App unit/integration tests:** `__tests__/` at repo root
- **Worker unit tests:** `worker/src/__tests__/`
- **Android E2E:** `.maestro/flows/` — see [testing/e2e-android.md](testing/e2e-android.md)
- **Live RLS gate:** `npm run test:rls:live` — see [testing/verify-pipeline.md](testing/verify-pipeline.md)

Run everything:

```powershell
npm.cmd run verify
```

On Windows, if Vitest fails with `spawn EPERM`, use `npm.cmd run verify:win`.

## Deployment checklist

See [security/production-hardening.md](security/production-hardening.md) for the full sign-off list. Summary:

1. **New Supabase project:** apply `supabase/schema.sql`, then `supabase/bootstrap-owner.sql`.
   **Existing project:** apply `supabase/security-hardening-migration.sql` (after `fix-rls-security.sql` only if never applied).
2. Disable public signup; run `npm run test:rls:live`.
3. Set `.env` from `.env.example`.
4. Deploy Worker secrets and `npm run deploy --workspace myshepherdline-worker`.
5. Run `npm.cmd run verify`.
6. Complete [compliance/legal-review-signoff.md](compliance/legal-review-signoff.md) with counsel.
7. Run E2E smoke when Maestro and a preview build are available.
