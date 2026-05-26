# Security Compromise Runbook (Draft)

Aligned to POPIA section 22 and Regulator notification expectations.

## 1. Detect and contain

- Confirm incident scope (app, Supabase, Worker, device tokens)
- Revoke compromised credentials/secrets
- Disable affected accounts or endpoints if needed

## 2. Assess

- Categories of personal information affected
- Number of data subjects affected
- Likely harm and whether special personal information is involved

## 3. Notify

- Internal escalation to Information Officer and leadership immediately
- Notify affected data subjects without undue delay where required
- Notify the Information Regulator where required
- Document notifications using approved templates/forms

## 4. Recover

- Rotate Supabase service role key and review RLS policies
- Rotate Worker secrets (`DIGEST_CRON_SECRET`, etc.)
- Invalidate suspicious push tokens

## 5. Review

- Root cause analysis
- Update controls, tests, and training
- Record incident in compliance register

Contact tree: `[IO]`, `[TECH ADMIN]`, `[LEGAL COUNSEL]`
