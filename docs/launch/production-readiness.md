# Production readiness checklist

Maps launch blockers from product/security review to owner actions. Code can enforce technical gates; legal and store
submission steps require humans outside the repo.

## High — must resolve before paid/public launch

| Area | Status | Action |
| --- | --- | --- |
| Onboarding / invite | In-app invite from Admin → Access Requests (Worker `POST /admin/access-requests/invite`) | Apply `supabase/invite-provisioning-migration.sql`; configure Supabase invite email + redirect `myshepherdline://sign-in` |
| Privacy & terms | Draft until counsel approves | Complete [legal-review-signoff.md](../compliance/legal-review-signoff.md); set `EXPO_PUBLIC_LEGAL_REVIEW_COMPLETE=true` for production builds |
| Offline / stale data | Hooks retain cached rows on refresh failure | QA poor-network on Today, People, and Tasks |

## Medium — recommended before scale

| Area | Status | Action |
| --- | --- | --- |
| Push delivery | Logic tested; OS dialogs need device QA | Follow [e2e-android.md](../testing/e2e-android.md) push section on a physical device |
| Production monitoring | Sentry wired (`@sentry/react-native`) | Set `EXPO_PUBLIC_SENTRY_DSN` and `EXPO_PUBLIC_MONITORING_ENABLED=true`; add `SENTRY_AUTH_TOKEN` as EAS secret for source maps |
| Bundle size | `expo-symbols` removed from app deps; npm override stubs `@expo-google-fonts/material-symbols` | Android export should not list `MaterialSymbols_400Regular.ttf` (~956KB) |

## Low — store submission

| Area | Status | Action |
| --- | --- | --- |
| App Store / Play | EAS profiles exist | Finalize screenshots, privacy nutrition labels, and submission notes |
| Load testing | k6 scripts in `load-tests/` | Run against staging Worker with realistic auth |

## Environment flags (production builds)

```env
EXPO_PUBLIC_LEGAL_REVIEW_COMPLETE=true
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@o0.ingest.sentry.io/0
EXPO_PUBLIC_MONITORING_ENABLED=true
EXPO_PUBLIC_WORKER_API_URL=https://your-worker.workers.dev
# Must be unset in production:
# EXPO_PUBLIC_ALLOW_REPORT_FALLBACK
```

Validate a release-shaped env locally before shipping:

```powershell
npm.cmd run check:env:production
```
