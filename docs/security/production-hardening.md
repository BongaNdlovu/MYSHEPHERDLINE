# Production security hardening

Checklist for taking MyShepherdLine from development to production with the security controls implemented in this repo.

## Before you start

- [ ] Legal/compliance review complete (see [../compliance/README.md](../compliance/README.md))
- [ ] Supabase project created and `.env` filled from `.env.example`
- [ ] Test shepherd and admin accounts created in Supabase Auth
- [ ] At least one member assigned to the test shepherd for scoped RLS checks

## 1. Database (Supabase)

### New project

Run the full schema in the Supabase SQL Editor:

```sql
-- Paste contents of supabase/schema.sql
```

Then run `supabase/bootstrap-owner.sql` for the owner account.

### Existing project (already has tables)

Run the security hardening migration:

```sql
-- Paste contents of supabase/security-hardening-migration.sql
```

This adds inactive-user RLS enforcement, inactive-by-default signup provisioning, atomic `log_visit()`, and expanded
audit triggers.

For older installs that never received tenant helpers, run `supabase/fix-rls-security.sql` first, then the security
hardening migration.

### Invite provisioning migration

After security hardening, run:

```sql
-- Paste contents of supabase/invite-provisioning-migration.sql
```

This lets Auth invite metadata set congregation, preferences, and activation on new profiles. Configure Supabase
**Authentication → URL Configuration** so invite links can redirect to `myshepherdline://sign-in`, or run
`npm run setup:auth-invite-redirect` with `SUPABASE_ACCESS_TOKEN` set.

### Disable public signup (required)

The app offers an **access-request** flow, but `/auth/v1/signup` remains open until disabled server-side.

**Dashboard:** Authentication → Providers → Email → turn off **Allow new users to sign up**.

**Management API** (with a personal access token):

```powershell
$env:SUPABASE_ACCESS_TOKEN = "<token-from-dashboard-account-tokens>"
$env:SUPABASE_PROJECT_REF = "<project-ref>"
npm run setup:auth-signup-off
```

Verify with `npm run test:rls:live` — the script fails if public signup still succeeds.

### Verify RLS in Supabase

After applying SQL, confirm policies in **Authentication → Policies** (or SQL):

| Table | Expected read scope |
| --- | --- |
| `profiles` | Own row or admin; inactive users blocked from tenant data |
| `members` | Assigned to self, or admin/owner (global) |
| `visits` | Logged by self, member currently assigned to self, or admin/owner |
| `tasks` | Assigned to self, or admin/owner (global) |
| `push_tokens` | Owner only |

Unassigned members and tasks are **admin/owner-only** until explicitly assigned in the admin app.

Quick manual check as a **shepherd** (not admin):

1. Sign in on the app.
2. Members list should show only members assigned to you.
3. Visit history should include visits you logged, even if the member was later reassigned.
4. Reports and tasks should reflect the same assigned-only scope.
5. Sign in as **admin** — full congregation data should be visible.

### Owner bootstrap

Do **not** hardcode owner emails in `schema.sql` or reusable migrations. After the owner signs in once:

1. Run `supabase/bootstrap-owner.sql` with the production owner email.
2. Confirm with `select email, role from public.profiles where role = 'owner';`

### Null assignment rollout

Before production cutover:

```sql
-- Paste supabase/verify-null-assignments.sql
```

Resolve any rows returned via the admin app or `supabase/resolve-null-assignments.sql` (review first).

Repo gate for schema shape:

```powershell
npm.cmd run test -- __tests__/security/rls-schema.test.ts
npm.cmd run test:rls:live
```

Optional inactive-user probe: create `inactive@test.local` in Supabase Auth, leave `profiles.is_active = false`, set
`E2E_INACTIVE_EMAIL` in `.env`, and re-run live RLS tests.

## Multi-congregation scope (v1)

Production v1 supports **multiple congregations** grouped by **districts**, with each user assigned to exactly one
congregation at a time. There is no in-app org switcher and no self-serve invite acceptance; those remain operator
actions. See [../product-scope.md](../product-scope.md).

## 2. Mobile app

### Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/publishable key only — never service role |
| `EXPO_PUBLIC_WORKER_API_URL` | Recommended | Worker base URL for reports and push registration |

### Auth session storage

Native builds use `expo-secure-store` (chunked for large sessions) via `lib/core/supabase-storage.ts`. Web dev uses `localStorage`.

After sign-out, the Supabase client clears the storage key `myshepherdline.auth.session`. Verify on a device:

1. Sign in.
2. Force-close the app.
3. Reopen — session should restore.
4. Sign out.
5. Reopen — should land on sign-in, not home.

## 3. Cloudflare Worker

### Secrets (required)

```powershell
npx.cmd wrangler secret put SUPABASE_URL --config worker/wrangler.toml
npx.cmd wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config worker/wrangler.toml
npx.cmd wrangler secret put DIGEST_CRON_SECRET --config worker/wrangler.toml
```

### Rate limiting (recommended for production)

1. Create a KV namespace in the Cloudflare dashboard.
2. Uncomment and fill `[[kv_namespaces]]` in `worker/wrangler.toml`:

    ```toml
    [[kv_namespaces]]
    binding = "RATE_LIMIT"
    id = "<production-kv-namespace-id>"
    preview_id = "<preview-kv-namespace-id>"
    ```

3. Redeploy. Without KV, the Worker falls back to in-memory limits (resets on restart, not suitable for multi-instance
   abuse resistance).

### CORS

Set `ALLOWED_ORIGINS` in `worker/wrangler.toml` to your app/web origins (comma-separated). Leave empty only for
API-only/mobile Bearer-token usage.

### Digest cron

Schedule a POST to `/notifications/send-digest` with header `X-Cron-Secret: <DIGEST_CRON_SECRET>`. Admins can also
trigger via Bearer token.

### Task reminder cron

Apply `supabase/care-reminders-migration.sql` so tasks have `due_at` and `reminder_sent_at`.

The Worker runs two crons (see `worker/wrangler.toml`):

- `0 8 * * *` — daily org digest (existing)
- `*/15 * * * *` — task due-soon reminders for open tasks with `due_at` in the next 60 minutes

Manual trigger (owner Bearer or `X-Cron-Secret`):

```http
POST /notifications/send-reminders
```

Shepherds must register a push token (More → Notifications, or automatic on sign-in when the Worker URL is set).

Audit events appear in Worker logs as JSON (`digest_sent`, `task_reminders_sent`, `digest_send_forbidden`, `push_token_registered`,
`rate_limit_exceeded`). Responses include `X-Request-Id` for correlation.

Deploy:

```powershell
npm.cmd run deploy --workspace myshepherdline-worker
```

Health check:

```powershell
curl https://your-worker.workers.dev/health
```

## 4. Verification pipeline

Full gate:

```powershell
npm.cmd run verify
```

`verify` includes `check:audit`, which **fails on high/critical** npm advisories but allows known moderate Expo-chain
issues. Do not run `npm audit fix --force` (downgrades Expo SDK).

If Vitest fails with `spawn EPERM` on Windows (common in restricted sandboxes), use:

```powershell
npm.cmd run verify:win
```

See [../testing/verify-pipeline.md](../testing/verify-pipeline.md).

## 5. Android E2E smoke (optional but recommended)

Requires Maestro CLI, emulator/device, and a preview build. See [../testing/e2e-android.md](../testing/e2e-android.md).

Minimal smoke after security changes:

```powershell
npm.cmd run test:e2e:smoke
npm.cmd run test:e2e:admin
```

Smoke covers landing → sign-in → reports → sign-out → shepherd admin guard. Admin flows cover Admin Center, members
list, and admin reports (requires `E2E_ADMIN_*` credentials on a preview build).

## 6. Production launch sign-off

- [ ] `npm.cmd run verify` green on CI or maintainer machine
- [ ] `npm.cmd run test:rls:live` green (includes signup-disabled check)
- [ ] Public signup disabled in Supabase Auth
- [ ] RLS manual checks passed for shepherd and admin
- [ ] Worker health OK; digest cron configured
- [ ] KV rate limit bound (or accepted risk documented)
- [ ] No service-role or cron secrets in the mobile app or git
- [ ] E2E smoke passed on preview build (or manual test script completed)
- [ ] Compliance docs reviewed and [legal-review-signoff.md](../compliance/legal-review-signoff.md) completed by
  qualified counsel
- [ ] Product scope acknowledged: public visitor/prayer/event/CSV flows are out of scope for v1

## Rollback

If scoped RLS breaks a workflow:

1. Re-run previous permissive read policies from git history **only as a temporary measure**.
2. Fix assignment data or app queries, then re-apply `fix-rls-security.sql`.
3. Do not ship with `using (true)` read policies on members, visits, or tasks in production.
