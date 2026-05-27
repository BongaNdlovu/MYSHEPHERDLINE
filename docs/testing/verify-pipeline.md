# Verification pipeline

How to run the repo quality gates and recover when tests fail to start.

## Standard command

From the repo root:

```powershell
npm.cmd run verify
```

This runs, in order:

1. `typecheck` — Expo app TypeScript
2. `lint` — ESLint (excludes `dist/` and `worker/dist/`)
3. `check:lockfiles` — single root lockfile hygiene
4. `check:audit` — fails on high/critical npm advisories; warns on known Expo moderate issues
5. `test` — Vitest in `__tests__/`
6. `test:worker` — Worker typecheck + Vitest

## Individual commands

| Command | Purpose |
| --- | --- |
| `npm.cmd run typecheck` | App TS only |
| `npm.cmd run lint` | ESLint |
| `npm.cmd run test` | App tests |
| `npm.cmd run test:win` | App tests with single-fork pool (Windows fallback) |
| `npm.cmd run test:worker:win` | Worker typecheck + tests (Windows-friendly pool) |
| `npm.cmd run verify:win` | Full gate using Windows-friendly test pools |

## Windows `spawn EPERM` troubleshooting

Some Windows environments block Vitest from spawning child processes when loading TypeScript configs through esbuild. Symptom:

```text
Error: spawn EPERM
  at ... vitest.config.ts
```

The repo uses plain `vitest.config.mjs` files to avoid TS config transpilation. If EPERM persists, use the Windows
fallback commands below.

### Fix 1: Use the repo fallback (recommended)

```powershell
npm.cmd run verify:win
```

Or for app tests only:

```powershell
npm.cmd run test:win
```

Both configs set `pool: 'forks'` with `singleFork: true` to minimize process spawns. The explicit CLI flags in
`test:win` / `verify:win` override any local Vitest defaults.

### Fix 2: Run outside restricted sandboxes

If you use an IDE agent or CI sandbox that blocks process creation, run `verify` in a normal terminal (PowerShell,
Windows Terminal) with full permissions.

### Fix 3: Antivirus / Controlled Folder Access

Add exclusions for the repo and `node_modules`, or temporarily disable Controlled Folder Access for Node.js. EPERM often
comes from security software blocking `esbuild.exe` or forked Node children.

### Fix 4: Reinstall toolchain

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force worker/node_modules
npm.cmd install
npm.cmd run verify
```

## Test layout

| Location | What it covers |
| --- | --- |
| `__tests__/security/` | Env fail-fast, RLS schema shape, admin route auth gates, secure auth storage |
| `scripts/test-rls-negative-cases.mjs` | Live forbidden-query RLS checks against configured Supabase (staging gate) |
| `__tests__/domain/assignment.test.ts` | Shepherd assignment helpers and validation |
| `__tests__/domain/` | Pure selectors (members, tasks, reports) |
| `__tests__/integration/` | Worker API client |
| `worker/src/__tests__/` | Worker routes, auth, rate limit, reports, notifications |

## Capacity gate (staging / pre-release)

Capacity and performance budgets are **release-blocking on staging**, not on every commit.

1. Apply `supabase/organization-capacity-migration.sql` on staging if not already applied.
2. Run k6 load tests — see [capacity-plan.md](capacity-plan.md).
3. Confirm p95/p99 latency and error rate thresholds before production rollout.

```powershell
$env:LOAD_BASE_URL = "https://your-worker.example.dev"
$env:LOAD_AUTH_TOKEN = "<staging JWT>"
npm.cmd run test:load:health
npm.cmd run test:load:reports
```

## Expected green output

- App: 25 test files, 115+ tests (1 live RLS test skipped by default)
- Worker: 7 test files, 44 tests
- Lint: 0 errors
- Audit: 0 high/critical (moderate Expo-chain advisories may warn)

Worker route tests may print audit JSON to stdout during digest scenarios — that is expected.

## Live RLS denial gate (staging / pre-release)

Schema-string tests in `__tests__/security/rls-negative-cases.test.ts` do not execute real forbidden queries. For
security-grade negative-path validation against your Supabase project:

1. Apply `supabase/seed-e2e-data.sql` on the target project (E2E users + cross-assignee fixtures).
2. Ensure `.env` points at that project with publishable key only (never service role in the app).

```powershell
npm.cmd run test:rls:live
```

Optional Vitest wrapper (same runner, skipped unless explicitly enabled):

```powershell
$env:RLS_LIVE_TESTS = "1"
npm.cmd run test -- __tests__/security/rls-negative-cases.live.test.ts
```

This gate is **not** part of default `npm run verify` because it requires live credentials and seeded data.
