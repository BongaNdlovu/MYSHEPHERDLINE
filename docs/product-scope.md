# Product scope

MyShepherdLine is an **internal shepherd tool** for pastoral care teams. It is not a public church-facing platform.

## In scope

- Admin-provisioned shepherd, admin, and owner accounts
- **Multiple congregations** grouped by **districts** (data isolated per congregation)
- Member directory scoped by assignment (shepherds) or congregation-wide (admins)
- Shepherd **Add member** on the Members tab (auto-assigned to the signed-in shepherd)
- Visit logging, follow-up tasks, and operational reports
- Owner-managed user activation, role changes, and congregation creation within a district
- Internal member create/edit (admin) as each congregation’s system of record for assigned pastoral care

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
| In-app org switching for one user | Not implemented | Each account belongs to one congregation; operators re-provision to move |
| Public self-service sign-up | Not implemented | Access requests plus admin/operator email invites |

**Do not treat the rows above as production blockers** for an internal shepherd deployment. They are excluded by
product decision.

## Contact and member workflows in the app

| Need | Supported in app |
| --- | --- |
| Admin creates/edits a member | Yes — Admin → Members |
| Shepherd adds a member to their care list | Yes — Members tab → Add member |
| Shepherd views assigned member profile | Yes — Members tab |
| Shepherd logs a visit / call | Yes — Log visit |
| Admin assigns member to shepherd | Yes — member form |
| Public submits contact details without an account | No — out of scope |

## Tenancy model

The database uses a **district → congregation (organization) → users/members** hierarchy:

- **`districts`** — grouping layer (e.g. “Durban District”)
- **`organizations`** — one row per congregation; all members, visits, and tasks are scoped by `organization_id`
- **`profiles.organization_id`** — each user belongs to exactly one congregation at a time

**Data isolation:** RLS enforces congregation boundaries. Shepherds and admins only see data for their congregation.
Owners can list congregations in the same district and create new congregation tenants (**Admin → Congregations**).

**Provisioning:** New users are created in Supabase Auth by an operator, with `organization_id` set on their profile
(via invite metadata or dashboard). `handle_new_user()` defaults to the seed default org when metadata is absent.
Owners activate accounts in **Admin → Users & Roles**.

There is **no in-app congregation switcher** — moving a shepherd to another church is an operator action (update
profile `organization_id` in Supabase).

Apply `supabase/multi-congregation-migration.sql` on existing projects that predate the districts table.

## Operator checklist

1. Apply `supabase/security-hardening-migration.sql` on the Supabase project
2. Apply `supabase/multi-congregation-migration.sql` when enabling districts / multi-congregation
3. Disable public signup (Dashboard or `npm run setup:auth-signup-off`)
4. Bootstrap owner with `supabase/bootstrap-owner.sql`
5. Create shepherd accounts in Supabase Auth; set `organization_id`; activate in the admin app
6. Run `npm run test:rls:live` before each production release
7. Complete [compliance/legal-review-signoff.md](compliance/legal-review-signoff.md) with qualified counsel before launch

## Future phases (not committed)

If leadership later wants public intake, prayer requests, CSV export, or cross-district owner dashboards, treat each as
a **separate product phase** with its own privacy review, RLS design, and E2E coverage — not as gaps in the current
internal tool.
