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

### Existing project (already has tables)

Run the incremental patch instead:

```sql
-- Paste contents of supabase/fix-rls-security.sql
```

This adds `public.is_admin()` and replaces permissive read policies with scoped ones.

### Verify RLS in Supabase

After applying SQL, confirm policies in **Authentication → Policies** (or SQL):

| Table | Expected read scope |
| --- | --- |
| `profiles` | Own row or admin |
| `members` | Unassigned, assigned to self, or admin |
| `visits` | Logged by self, member in scope, or admin |
| `tasks` | Unassigned, assigned to self, or admin |
| `push_tokens` | Owner only |

Quick manual check as a **shepherd** (not admin):

1. Sign in on the app.
2. Members list should show only unassigned members and members assigned to you.
3. Reports and tasks should reflect the same scope.
4. Sign in as **admin** — full congregation data should be visible.

Repo gate for schema shape:

```powershell
npm.cmd run test -- __tests__/security/rls-schema.test.ts
```

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

3. Redeploy. Without KV, the Worker falls back to in-memory limits (resets on restart, not suitable for multi-instance abuse resistance).

### CORS

Set `ALLOWED_ORIGINS` in `worker/wrangler.toml` to your app/web origins (comma-separated). Leave empty only for API-only/mobile Bearer-token usage.

### Digest cron

Schedule a POST to `/notifications/send-digest` with header `X-Cron-Secret: <DIGEST_CRON_SECRET>`. Admins can also trigger via Bearer token.

Audit events appear in Worker logs as JSON (`digest_sent`, `digest_send_forbidden`, `push_token_registered`, `rate_limit_exceeded`). Responses include `X-Request-Id` for correlation.

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
```

Flows covered: landing → sign-in → sign-out.

For member/visit flows, seed a member assigned to the test shepherd matching `E2E_MEMBER_NAME`.

## 6. Production launch sign-off

- [ ] `npm.cmd run verify` green on CI or maintainer machine
- [ ] RLS manual checks passed for shepherd and admin
- [ ] Worker health OK; digest cron configured
- [ ] KV rate limit bound (or accepted risk documented)
- [ ] No service-role or cron secrets in the mobile app or git
- [ ] E2E smoke passed on preview build (or manual test script completed)
- [ ] Compliance docs reviewed by qualified counsel

## Rollback

If scoped RLS breaks a workflow:

1. Re-run previous permissive read policies from git history **only as a temporary measure**.
2. Fix assignment data or app queries, then re-apply `fix-rls-security.sql`.
3. Do not ship with `using (true)` read policies on members, visits, or tasks in production.
