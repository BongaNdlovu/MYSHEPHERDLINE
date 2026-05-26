# Verification pipeline

How to run the repo quality gates and recover when tests fail to start.

## Standard command

From the repo root:

```powershell
npm.cmd run verify
```

This runs, in order:

1. `typecheck` — Expo app TypeScript (`tsc --noEmit`)
2. `lint` — ESLint across the repo
3. `test` — Vitest unit/integration tests in `__tests__/`
4. `test:worker` — Worker typecheck + Vitest in `worker/src/__tests__/`

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
| `__tests__/domain/assignment.test.ts` | Shepherd assignment helpers and validation |
| `__tests__/domain/` | Pure selectors (members, tasks, reports) |
| `__tests__/integration/` | Worker API client |
| `worker/src/__tests__/` | Worker routes, auth, rate limit, reports, notifications |

## Expected green output

- App: 9 test files, 24+ tests
- Worker: 5 test files, 15+ tests
- Lint: 0 errors, 0 warnings

Worker route tests may print audit JSON to stdout during digest scenarios — that is expected.
