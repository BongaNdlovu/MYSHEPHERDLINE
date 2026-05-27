# Product scope

MyShepherdLine is an **internal shepherd tool** for a single congregation. It is not a public church-facing platform.

## In scope

- Admin-provisioned shepherd, admin, and owner accounts
- Member directory scoped by assignment (shepherds) or global (admins)
- Visit logging, follow-up tasks, and operational reports
- Owner-managed user activation and role changes
- Internal member create/edit (admin) as the congregation’s system of record for assigned pastoral care

## Intentionally out of scope (v1 — not missing work)

These flows are **not planned for v1** because the product is an internal staff tool, not a public member portal.
Congregations should continue using existing processes (phone, email, in-person intake, website forms, spreadsheets)
for these needs until a future phase is explicitly scoped.

| Flow | App status | Where congregations handle it instead |
| --- | --- | --- |
| Public visitor registration | Not implemented | Welcome desk, website form, email to office |
| Dedicated public contact intake | Not implemented | Church office / CRM / email |
| Prayer requests | Not implemented | Pastoral team inbox, prayer chain, paper forms |
| Events / public web forms | Not implemented | Church website, Eventbrite, manual lists |
| CSV / bulk export | Not implemented | Admin SQL/reporting exports by operator; future phase if required |
| Multi-congregation self-serve onboarding | Not implemented | Single default org; owner provisions accounts |
| Self-service sign-up | Blocked server-side | Supabase Auth invites / dashboard user creation |

**Do not treat the rows above as production blockers** for an internal shepherd deployment. They are excluded by
product decision.

## Contact and member workflows in the app

| Need | Supported in app |
| --- | --- |
| Admin creates/edits a member | Yes — Admin → Members |
| Shepherd views assigned member profile | Yes — Members tab |
| Shepherd logs a visit / call | Yes — Log visit |
| Admin assigns member to shepherd | Yes — member form |
| Public submits contact details without an account | No — out of scope |

## Tenancy model

The database includes an `organizations` table for future scaling, but **production v1 runs as a single default
organization** (`Default Organization`). All profiles are provisioned into that org by the owner via Supabase Auth
invites or dashboard user creation, then activated in **Admin → Users & Roles**.

Do not expose org switching, self-serve invites, or cross-church signup flows until a deliberate multi-church product
phase is scoped.

## Operator checklist

1. Apply `supabase/security-hardening-migration.sql` on the Supabase project
2. Disable public signup (Dashboard or `npm run setup:auth-signup-off`)
3. Bootstrap owner with `supabase/bootstrap-owner.sql`
4. Create shepherd accounts in Supabase Auth; activate in the admin app
5. Run `npm run test:rls:live` before each production release
6. Complete [compliance/legal-review-signoff.md](compliance/legal-review-signoff.md) with qualified counsel before launch

## Future phases (not committed)

If leadership later wants public intake, prayer requests, or CSV export, treat each as a **separate product phase**
with its own privacy review, RLS design, and E2E coverage — not as gaps in the current internal tool.
