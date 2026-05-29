# Step-by-step production setup

Use this guide for first-time setup or security hardening. Replace placeholder values with your congregation’s project details.

## Prerequisites

- Supabase project with URL and publishable key in `.env`
- Optional: Worker URL in `EXPO_PUBLIC_WORKER_API_URL`

## Step 1 — Check connectivity (2 min)

```powershell
npm.cmd run check:env
```

## Step 2 — Apply database security (10 min)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. **New project:** run full `supabase/schema.sql`.
3. **Existing project:** run `supabase/security-hardening-migration.sql`.
4. Run `supabase/care-reminders-migration.sql` and `supabase/profile-preferences-migration.sql` (safe to re-run).
5. Confirm: `npm run verify:migrations` (needs `SUPABASE_ACCESS_TOKEN` in `.env`) or paste
   `supabase/verify-required-migrations.sql` in SQL Editor — all columns should be `true`.
6. Disable public signup: **Authentication → Providers → Email → disable “Allow new users to sign up”** (or
   `npm run setup:auth-signup-off` with a Management API token).
7. Run `supabase/verify-policies.sql` — permissive-read probe should return **0 rows**.

## Step 3 — Bootstrap owner (5 min)

After the owner signs in once in Auth:

1. Edit `supabase/bootstrap-owner.sql` with the owner email.
2. Run in SQL Editor.
3. Confirm: `select email, role, is_active from public.profiles where role = 'owner';`

## Step 4 — Create test users (5 min)

Preferred: **Admin → Access Requests → Approve & send invite** (requires Worker URL and
`supabase/invite-provisioning-migration.sql`).

Fallback: Supabase **Authentication → Users → Add user** (or dashboard invite):

| Email | Notes |
| --- | --- |
| `shepherd@test.local` | Default shepherd; activate in Admin if profile is inactive |
| `admin@test.local` | Promote to admin in seed SQL |
| `shepherd2@test.local` | Optional — cross-shepherd denial tests |

Look up UUIDs:

```sql
select id, email from auth.users order by created_at desc;
```

## Step 5 — Provision real congregation data

Create real districts, congregations, members, tasks, and provisioned shepherd accounts in Supabase for your
environment. Maestro and live RLS checks require real records configured through `.env` (see `.env.example`).

## Step 6 — Deploy Worker (10 min)

Never put the Supabase **service_role** key in the mobile app or git.

```powershell
npm.cmd run setup:worker
```

Or set secrets manually and deploy:

```powershell
npm.cmd run deploy --workspace myshepherdline-worker
```

Verify health: `curl https://YOUR-WORKER.workers.dev/health`

## Step 7 — Run the app (5 min)

```powershell
npm.cmd start
```

- Shepherd: should see assigned members only (e.g. Sipho).
- Admin: full member list.

## Step 8 — Verification gate

```powershell
npm.cmd run verify
npm.cmd run test:rls:live
```

Windows fallback: `npm.cmd run verify:win`

## Step 9 — Compliance (before production)

Counsel must complete [compliance/legal-review-signoff.md](../compliance/legal-review-signoff.md). Public flows
(visitor registration, prayer requests, CSV export) are **out of scope** — see
[product-scope.md](../product-scope.md).

## Step 10 — Android E2E (optional)

```powershell
$env:E2E_EMAIL = "shepherd@test.local"
$env:E2E_PASSWORD = "YourPassword"
$env:E2E_ADMIN_EMAIL = "admin@test.local"
$env:E2E_ADMIN_PASSWORD = "YourPassword"
$env:E2E_MEMBER_NAME = "Sipho"
npm.cmd run test:e2e:smoke
npm.cmd run test:e2e:admin
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Empty members list for shepherd | Run seed SQL; assign member to shepherd |
| Sign-in then immediate sign-out | Profile `is_active = false` — owner activates in Admin → Users |
| Worker 500 missing secrets | Re-run Worker secret setup |
| Reports local fallback only | Set `EXPO_PUBLIC_WORKER_API_URL` and restart Metro |
| `spawn EPERM` running tests | `npm run verify:win` |

## Reference docs

- [production-hardening.md](../security/production-hardening.md)
- [verify-pipeline.md](../testing/verify-pipeline.md)
- [e2e-android.md](../testing/e2e-android.md)
- [product-scope.md](../product-scope.md)
