# Step-by-step production setup

Use this guide if you are setting up MyShepherdLine for the first time or finishing security hardening. Your project
already has Supabase credentials in `.env`; the Worker URL still needs to be configured.

## Where you are now

| Item | Status |
| --- | --- |
| Supabase URL + publishable key in `.env` | Configured |
| Worker URL in `.env` | **Configured** — `myshepherdline-api.fanelesibonge50.workers.dev` |
| Cloudflare KV rate limiting | **Configured** |
| Worker secrets | **Set** (see `.secrets/worker.local` for digest cron secret) |
| RLS hardening SQL | **Run manually in Supabase** — `npm run setup:supabase` |
| E2E test data | **Run seed SQL after creating users** |

## Step 1 — Check connectivity (2 min)

```powershell
npm.cmd run check:env
```

This confirms Supabase is reachable. Worker check is skipped until Step 3.

## Step 2 — Apply database security (10 min)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. If this is a **new** project, paste and run the full `supabase/schema.sql`.
3. If tables **already exist**, paste and run `supabase/fix-rls-security.sql` instead.
4. Run `supabase/verify-policies.sql` and confirm:
   - All 5 core tables have `rls_enabled = true`
   - The permissive-read query at the bottom returns **0 rows**
   - `is_admin` function exists

## Step 3 — Create test users (5 min)

In Supabase **Authentication → Users → Add user**:

| Email | Password | Role |
| --- | --- | --- |
| `shepherd@test.local` | (your choice) | shepherd (default) |
| `admin@test.local` | (your choice) | promote in seed SQL |

Copy both user UUIDs from the users table or:

```sql
select id, email from auth.users order by created_at desc;
```

## Step 4 — Seed E2E data (5 min)

1. Open `supabase/seed-e2e-data.sql`
2. Replace `REPLACE_SHEPHERD_USER_ID` and `REPLACE_ADMIN_USER_ID` with the UUIDs from Step 3
3. Run the script in SQL Editor

This creates **Sarah Mkhize** (assigned to a second shepherd for denial tests) and **Sipho Dlamini** (assigned to your
test shepherd) for Maestro flows.

## Step 5 — Deploy Worker (10 min)

You need the **service_role** key from Supabase → Settings → API. Never put this in the mobile app or git.

```powershell
npm.cmd run setup:worker
```

This script will:

- Create a Cloudflare KV namespace for rate limiting
- Prompt for Worker secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DIGEST_CRON_SECRET`)
- Deploy the Worker
- Write `EXPO_PUBLIC_WORKER_API_URL` into `.env`

Verify:

```powershell
npm.cmd run check:env
curl https://YOUR-WORKER.workers.dev/health
```

Expected: `{"status":"healthy","service":"myshepherdline-api"}`

## Step 6 — Run the app (5 min)

```powershell
npm.cmd start
```

Sign in as `shepherd@test.local`:

- You should see Sipho (assigned to you)
- You should **not** see Sarah (assigned to another shepherd) or unassigned records

Sign in as `admin@test.local`:

- Full member list

## Step 7 — Verification gate

```powershell
npm.cmd run verify
```

Windows fallback:

```powershell
npm.cmd run verify:win
```

## Step 8 — Android E2E (optional)

Install Maestro: [Maestro installation guide](https://maestro.mobile.dev/docs/getting-started/installation)

```powershell
$env:E2E_EMAIL = "shepherd@test.local"
$env:E2E_PASSWORD = "YourPassword"
$env:E2E_MEMBER_NAME = "Sipho"
npm.cmd run test:e2e:smoke
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Empty members list for shepherd | Run seed SQL; ensure the member is assigned to that shepherd (`E2E_MEMBER_NAME=Sipho`) |
| Worker returns 500 `missing` secrets | Re-run `npm run setup:worker` |
| Reports use local fallback only | Set `EXPO_PUBLIC_WORKER_API_URL` in `.env` and restart Metro |
| `spawn EPERM` running tests | Use `npm run verify:win` |

## Reference docs

- [production-hardening.md](../security/production-hardening.md) — full checklist
- [verify-pipeline.md](../testing/verify-pipeline.md) — test troubleshooting
- [e2e-android.md](../testing/e2e-android.md) — Maestro flows
