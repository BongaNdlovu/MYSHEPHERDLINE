# Architecture

MyShepherdLine uses a **hybrid feature-first** layout: business features live together under `features/`, while shared infrastructure stays centralized under `lib/core/` and reusable UI primitives under `components/ui/`.

## Principles

1. **Routes are thin** — files in `app/` only wire Expo Router URLs to feature screens.
2. **Features own business logic** — each feature contains its UI, hooks, services, and pure selectors.
3. **Shared code stays generic** — auth, env, Supabase, API helpers, and design-system components do not import feature code.
4. **Data flow is explicit** — screen → hook → service/selector → backend.

## Folder map

```
app/                      Expo Router routes (thin re-exports only)
features/
  auth/                   Sign-in, sign-up, landing, More tab
  home/                   Home dashboard
  members/                Directory, profile, member selectors/services
  tasks/                  Task list, task selectors/services
  reports/                Reports screen, summary hook, report selectors
  visits/                 Log-visit flow and visit mutations
  legal/                  Privacy and terms screens
components/ui/            Shared UI primitives (Card, FormField, QueryStateView, …)
lib/core/                 Env, Supabase client, auth, API, toast, notifications
constants/                Theme tokens and Maestro test IDs
types/                    Backend/domain types (source of truth)
worker/src/               Cloudflare Worker modules
__tests__/                Unit/integration tests and fixtures
```

## Feature internal pattern

Each feature follows the same shape where applicable:

```
features/members/
  screens/          Route-facing containers (MembersScreen, MemberProfileScreen)
  components/       Feature-specific UI (MemberListItem, FilterChips)
  hooks/            Data orchestration (useMembers, useMember)
  services/         Supabase/Worker calls (members.service.ts)
  selectors/        Pure business logic (filterMembers, membersNeedingAttention)
```

## Where to put new code

| Kind of code | Location |
|---|---|
| New route/URL | `app/` — re-export a feature screen |
| Feature screen | `features/<feature>/screens/` |
| Feature-only UI | `features/<feature>/components/` |
| Data fetching hook | `features/<feature>/hooks/` |
| Supabase/Worker I/O | `features/<feature>/services/` |
| Pure transforms/filters | `features/<feature>/selectors/` |
| Reusable button/card/input | `components/ui/` |
| Auth, env, Supabase, API | `lib/core/` |
| Database row types | `types/database.ts` |
| Worker endpoint logic | `worker/src/` |

## Example data flow: Members list

```
app/(tabs)/members.tsx
  └─ re-exports MembersScreen

features/members/screens/MembersScreen.tsx
  └─ useMembers() hook
  └─ filterMembers() selector for search/filter UI

features/members/hooks/useMembers.ts
  └─ fetchMembers() service

features/members/services/members.service.ts
  └─ requireSupabase().from('members').select(...)

features/members/selectors/members.ts
  └─ pure filterMembers(), membersNeedingAttention() — no React, no Supabase
```

## Import boundaries

- `app/*` may import `features/*`, `components/ui/*`, `lib/core/*`
- `features/*` may import `components/ui/*`, `lib/core/*`, `types/*`, other features only when necessary (prefer shared selectors in the owning feature)
- `components/ui/*` and `lib/core/*` must **not** import from `features/*`
- `features/*/selectors/*` must stay framework-free (no React, no Supabase)

## Query and mutation patterns

- **Lists/details:** use feature hooks returning `{ data, loading, error, refresh }` via `QueryState` from `lib/core/query-types.ts`
- **UI feedback:** render loading/error/empty with `QueryStateView` from `components/ui/`
- **Mutations:** hooks expose action methods (e.g. `toggleTask`) that call services and surface errors to `useToast()`

## Worker

The Worker under `worker/src/` is already modular (`auth`, `reports`, `notifications`, `http`, `env`, `rate-limit`). App-side report fetching tries the Worker first (`features/reports/services/reports.service.ts`) and falls back to local Supabase aggregation when the Worker URL is unset or unreachable.

## Tests

- Domain/selector tests live in `__tests__/domain/` and import from `features/*/selectors/`
- Config/security tests import from `lib/core/env`
- Demo fixtures stay in `__tests__/fixtures/` only — never bundled in production screens

Run the full gate:

```powershell
npm.cmd run verify
```
