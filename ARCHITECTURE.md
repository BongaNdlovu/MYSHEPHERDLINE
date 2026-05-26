# Architecture

MyShepherdLine uses a **hybrid feature-first** layout: business features live together under `features/`, while shared infrastructure stays centralized under `lib/core/` and reusable UI primitives under `components/ui/`.

## Principles

1. **Routes are thin** - files in `app/` only wire Expo Router URLs to feature screens.
2. **Features own business logic** - each feature contains its UI, hooks, services, and pure selectors.
3. **Shared code stays generic** - env, Supabase, API helpers, and design-system components do not import feature code.
4. **Data flow is explicit** - screen -> hook -> service/selector -> backend.

## Folder map

```
app/                      Expo Router routes (thin re-exports only)
features/
  auth/                   Landing, sign-in, sign-up
  account/                More tab: quick actions, legal links, sign out
  home/                   Home dashboard
  members/                Directory, profile, member selectors/services
  tasks/                  Task list, task selectors/services
  reports/                Reports screen, summary hook, report selectors
  visits/                 Log-visit flow and visit mutations
  legal/                  Privacy and terms screens
components/ui/            Shared UI primitives (Card, FormField, QueryStateView, ...)
lib/core/                 Env, Supabase client, auth session, API, toast, notifications
lib/app-shell/            Shell-level behavior (auth redirect gate)
constants/                Theme tokens and Maestro test IDs
types/                    Backend/domain types (source of truth)
worker/src/               Cloudflare Worker modules
__tests__/                App unit/integration tests and fixtures
docs/                     Documentation entrypoint (see docs/README.md)
```

## Feature internal pattern

Every feature uses the same folder shape. Empty folders are kept with `.gitkeep` so the layout stays predictable:

```
features/members/
  index.ts          Public barrel exports for the feature
  screens/          Route-facing containers (MembersScreen, MemberProfileScreen)
  components/       Feature-specific UI (MemberListItem, FilterChips)
  hooks/            Data orchestration (useMembers, useMember)
  services/         Supabase/Worker calls (members.service.ts)
  selectors/        Pure business logic (filterMembers, membersNeedingAttention)
```

Import from the feature barrel when consuming from outside the feature:

```ts
import { useMembers, MembersScreen, filterMembers } from '@/features/members';
import { MoreScreen } from '@/features/account';
```

Deep imports (`@/features/members/hooks/useMembers`) are still valid inside the feature or when avoiding circular dependencies.

## App shell vs business features

Shell concerns that are not owned by a business feature:

| Concern | Location |
| --- | --- |
| Root stack layout, fonts, providers | `app/_layout.tsx` |
| Tab navigation chrome | `app/(tabs)/_layout.tsx` |
| Auth gate / initial redirect | `lib/app-shell/AuthRedirect.tsx` via `app/index.tsx` |
| Config error UI | `components/ui/ConfigErrorScreen.tsx` |
| Toast provider and snackbar | `lib/core/toast.tsx`, `components/ui/ToastSnackbar.tsx` |

Expo Router requires route files to stay under `app/`. Shell route files should remain thin re-exports.

## Where to put new code

| Kind of code | Location |
| --- | --- |
| New route/URL | `app/` - re-export a feature screen |
| Feature screen | `features/<feature>/screens/` |
| Feature-only UI | `features/<feature>/components/` |
| Data fetching hook | `features/<feature>/hooks/` |
| Supabase/Worker I/O | `features/<feature>/services/` |
| Pure transforms/filters | `features/<feature>/selectors/` |
| Public feature API | `features/<feature>/index.ts` |
| Reusable button/card/input | `components/ui/` |
| Env, Supabase, auth session, API | `lib/core/` |
| Shell redirect/navigation glue | `lib/app-shell/` |
| Database row types | `types/database.ts` |
| Worker endpoint logic | `worker/src/` |

## Example data flow: Members list

```
app/(tabs)/members.tsx
  -> re-exports MembersScreen from @/features/members

features/members/screens/MembersScreen.tsx
  -> useMembers() hook
  -> filterMembers() selector for search/filter UI

features/members/hooks/useMembers.ts
  -> fetchMembers() service

features/members/services/members.service.ts
  -> requireSupabase().from('members').select(...)

features/members/selectors/members.ts
  -> pure filterMembers(), membersNeedingAttention() - no React, no Supabase
```

## Import boundaries

- `app/*` may import `features/*`, `components/ui/*`, `lib/core/*`, `lib/app-shell/*`
- `features/*` may import `components/ui/*`, `lib/core/*`, `types/*`, other feature barrels when necessary
- `components/ui/*`, `lib/core/*`, and `lib/app-shell/*` must **not** import from `features/*`
- `features/*/selectors/*` must stay framework-free (no React, no Supabase)

## Query and mutation patterns

- **Lists/details:** use feature hooks returning `{ data, loading, error, refresh }` via `QueryState` from `lib/core/query-types.ts`
- **UI feedback:** render loading/error/empty with `QueryStateView` from `components/ui/`
- **Mutations:** hooks expose action methods (e.g. `toggleTask`) that call services and surface errors to `useToast()`

## Worker

The Worker under `worker/src/` is modular (`auth`, `reports`, `notifications`, `http`, `env`, `rate-limit`, `logger`). App-side report fetching tries the Worker first (`features/reports/services/reports.service.ts`) and falls back to local Supabase aggregation when the Worker URL is unset or unreachable.

## Security

Production controls and migration steps: [docs/security/production-hardening.md](docs/security/production-hardening.md).

| Layer | Control |
| --- | --- |
| Mobile auth | `expo-secure-store` session adapter (`lib/core/supabase-storage.ts`) |
| Database | RLS on all core tables; reads scoped by role/assignment (`supabase/schema.sql`) |
| Worker | Bearer auth + admin/cron gate for digest; optional KV rate limits; audit logs |
| App env | Fail-fast when Supabase vars missing (`lib/core/env.ts`) |

Shepherd-facing queries rely on RLS — services do not filter client-side for authorization. Worker summaries apply an additional role scope in `worker/src/reports.ts` when using the service role.

## Tests

We use two deliberate test locations:

| Package | Location | Why |
| --- | --- | --- |
| Expo app | `__tests__/` at repo root | Cross-cutting tests (env, security, selector/domain logic, integration) |
| Worker | `worker/src/__tests__/` | Co-located next to Worker modules |

- Selector/domain tests import from `features/*/selectors/` directly to avoid pulling React Native screens through barrels
- Config/security tests import from `lib/core/env`
- Demo fixtures stay in `__tests__/fixtures/` only - never bundled in production screens

Run the full gate:

```powershell
npm.cmd run verify
```

## npm workspaces

The repo root and `worker/` are npm workspaces. Run `npm install` once at the root to install both packages. Root scripts orchestrate app and Worker verification together.
