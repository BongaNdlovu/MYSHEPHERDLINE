# 5,000-user capacity plan

Production target for shared-backend deployments:

| Dimension | Target |
| --- | --- |
| Registered users | 5,000 |
| Organizations | 3–8 on one backend |
| Peak concurrent sessions | 150–300 |
| Member records | up to 25,000 |
| Visits | up to 250,000 |
| Tasks | up to 50,000 |

## Mobile UX budgets (p95)

| Flow | Budget |
| --- | --- |
| Cold launch → landing | ≤ 3.0s |
| Sign-in → home ready | ≤ 2.5s |
| Members/tasks first page | ≤ 1.2s |
| Member profile | ≤ 1.0s |
| Task toggle / visit submit ack | ≤ 0.8s |
| Reports summary (Worker) | ≤ 1.5s |

## Backend budgets (p95 / p99)

| Endpoint | p95 | p99 |
| --- | --- | --- |
| `/health` | ≤ 200ms | — |
| `/notifications/register` | ≤ 500ms | — |
| `/reports/summary` | ≤ 1.0s | ≤ 2.0s |

Peak load error rate must stay **below 1%**.

## Database rollout

1. New projects: `supabase/schema.sql` (includes organizations + tenant RLS + indexes + `worker_report_summary`).
2. Existing projects: run `supabase/organization-capacity-migration.sql` after prior security migrations.
3. Re-run `supabase/verify-policies.sql` and `supabase/verify-null-assignments.sql`.
4. Optional large-directory search: `supabase/member-search-trgm.sql` (`pg_trgm` GIN index on `members.full_name`).

Default organization UUID for backfill: `a0000000-0000-4000-8000-000000000001`.

## Application contracts

- List services use explicit projections and `fetch*Page` with `page`, `hasMore`, `loadMore`.
- List screens use `FlatList` via `PaginatedFlatList`.
- Production reports use the Worker RPC path.
- Local Supabase fallback requires `EXPO_PUBLIC_ALLOW_REPORT_FALLBACK=true` (dev/break-glass only).
- Worker auth context includes `organizationId`; report summaries are cached ~60s per tenant/user.
- Push digests run per organization (tenant-scoped summary + tokens).

## Staging capacity seed

**Staging only** — do not run on production.

```sql
-- After organization-capacity-migration.sql
-- supabase/seed-capacity-data.sql
```

Defaults: 25,000 members, 250,000 visits, 50,000 tasks across 4 organizations. Adjust the
configuration block at the top of the script for smaller smoke volumes.

Cleanup before re-seed (comments at bottom of the seed file):

```sql
delete from public.visits where notes = 'capacity-seed';
delete from public.tasks where title like 'Capacity task %';
delete from public.members where notes = 'capacity-seed';
```

## Release gates

### Correctness (every release)

- `npm run verify` (or `verify:win` on Windows)
- RLS + tenant-isolation schema tests
- Android Maestro flows (shepherd, admin, owner, inactive, unauthorized)

### Performance (staging)

- Cold launch, warm navigation, first-page render timings
- Member/task search responsiveness
- Visit submit and task toggle round-trips
- Worker report summary under normal and burst load

### Capacity (staging, nightly or pre-release)

- Seed realistic data (`supabase/seed-capacity-data.sql`; E2E seed for smoke)
- k6 load suite in `load-tests/k6/`
- Pass only if latency budgets hold and error rate &lt; 1%

### Failure triage order

1. Query shape and projection size
2. Missing indexes and tenant filters
3. UI virtualization and rerender reduction
4. Report aggregation strategy
5. Worker caching and endpoint optimization

## Load testing

```powershell
# Requires k6: https://k6.io/docs/get-started/installation/
$env:LOAD_BASE_URL = "https://your-worker.example.dev"
$env:LOAD_AUTH_TOKEN = "<staging JWT>"
k6 run load-tests/k6/worker-reports.js
k6 run load-tests/k6/worker-health.js
```

See [verify-pipeline.md](verify-pipeline.md) for the standard quality gate command.
