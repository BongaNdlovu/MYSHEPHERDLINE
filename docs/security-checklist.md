# Security Operations Checklist

Operational controls that live outside the app code. Review before each production release.

## Authentication brute-force protection (Gap 3)
Sign-in (`signInWithPassword`) runs directly against Supabase and does NOT pass through the
Cloudflare Worker, so the Worker rate limiter does not protect login. Verify in the Supabase
dashboard:
- Auth > Rate Limits: per-IP sign-in / token limits are enabled.
- Auth > Providers > Email: "Leaked password protection" (HaveIBeenPwned) is enabled.
- Minimum password length / strength policy is set (app enforces >= 6 client-side only).

## Report fallback in production (Gap 4)
`lib/core/env.ts` auto-enables the report fallback when `NODE_ENV === 'development'`.
- `scripts/check-env.mjs --production` fails if `EXPO_PUBLIC_ALLOW_REPORT_FALLBACK === 'true'`.
- Confirm production builds run with `NODE_ENV=production` and the flag unset.
- Run `npm run check:env:production` as part of the release gate.

## Web Content-Security-Policy (Gap 2)
`scripts/gen-csp-headers.mjs` writes `dist/_headers` at build time (wired into
`wrangler.jsonc` `build.command`).
- Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_WORKER_API_URL` are set in the build
  environment so `connect-src` resolves to the correct origins for that environment.
- After a build, confirm `dist/_headers` exists and that the logged `connect-src` matches the
  target Supabase + Worker origins; check the browser console for CSP violations and tighten/
  loosen only the offending directive.
