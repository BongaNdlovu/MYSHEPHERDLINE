# MyShepherdLine Compliance Pack (Internal Shepherd Tool)

Operational drafts for a **single-congregation internal shepherd app**. These documents support POPIA/PAIA readiness;
they are **not** a substitute for qualified South African legal/compliance counsel.

## What this repo provides vs what counsel must do

| Item | Repo status |
| --- | --- |
| Privacy/terms draft copy (in-app) | Draft — counsel must approve wording |
| PAIA manual, retention, breach runbook | Draft templates — congregation must fill placeholders |
| Impact assessment (internal tool) | Pre-filled factual draft — counsel must sign off |
| Legal review sign-off record | Template only — **must be completed by counsel** |
| Production launch authorization | **Cannot** be completed in code; requires human legal sign-off |

## Product context

- **Audience:** Provisioned shepherds, admins, and owners only
- **Data:** Member pastoral records, visit notes, and follow-up tasks for one congregation
- **Access:** Admin-managed accounts; no public self-service registration
- **Out of scope:** Public visitor registration, prayer requests, events/forms, CSV export, public contact intake — see
  [product-scope.md](../product-scope.md)

## Documents

| Document | Purpose |
| --- | --- |
| [Privacy Policy (in-app)](../../app/legal/privacy.tsx) | User-facing notice (re-exports `features/legal`) |
| [Terms & Conditions (in-app)](../../app/legal/terms.tsx) | Authorized-use terms |
| [PAIA Manual](./paia-manual.md) | Access-to-information procedure |
| [Information Officer Checklist](./information-officer-checklist.md) | IO appointment and publication tasks |
| [Impact Assessment (internal tool)](./impact-assessment-internal-tool.md) | Pre-filled PIA draft for counsel review |
| [Impact Assessment Template](./impact-assessment-template.md) | Blank template if you prefer to start fresh |
| [Retention & Deletion Schedule](./retention-schedule.md) | Record retention periods |
| [Security Compromise Runbook](./breach-runbook.md) | POPIA s22 incident response |
| [Data Subject Request Workflow](./data-subject-requests.md) | Access/correction/deletion intake |
| [Legal Review Sign-off](./legal-review-signoff.md) | **Required before production** — counsel completes |

## Pre-launch checklist (operator + counsel)

### Operator (technical / congregation admin)

- [ ] Apply `supabase/security-hardening-migration.sql` and run `npm run test:rls:live`
- [ ] Disable public Supabase signup
- [ ] Appoint Information Officer contact details in PAIA manual and in-app privacy notice
- [ ] Train shepherds/admins on confidentiality and authorized use
- [ ] Confirm sub-processors: Supabase, Cloudflare, Expo (see impact assessment)

### Counsel / Information Officer (legal)

- [ ] Review and approve in-app privacy policy and terms
- [ ] Confirm lawful basis for processing member/pastoral data (including religious context)
- [ ] Approve retention schedule for your congregation
- [ ] Publish PAIA manual if applicable
- [ ] Complete and sign [legal-review-signoff.md](./legal-review-signoff.md)
- [ ] Register/update Information Officer details with the Regulator where required

## Special personal information note

Congregation membership and pastoral care context may reveal religious belief. Treat member records as potentially
special personal information under POPIA. Counsel must confirm handling before launch.
