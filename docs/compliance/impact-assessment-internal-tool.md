# Personal Information Impact Assessment — Internal Shepherd Tool (Draft)

**Status:** Factual draft for counsel review. **Not approved for production until signed in**
[legal-review-signoff.md](./legal-review-signoff.md).

## 1. Processing description

| Item | Detail |
| --- | --- |
| System | MyShepherdLine (Expo app + Supabase + Cloudflare Worker) |
| Product type | Internal shepherd tool — **not** a public member portal |
| Data subjects | Congregation members (adults); authorized shepherds, admins, owners |
| Data categories | Identity & contact (members, shepherds); pastoral metadata (risk, status, assignment); visit & task logs; optional push tokens |
| Data **not** collected in v1 | Public prayer requests, event registrations, anonymous visitor submissions, health records |

## 2. Purpose and necessity

| Category | Purpose | Necessity |
| --- | --- | --- |
| Shepherd accounts | Authenticate authorized staff | Required for access control |
| Member contact details | Enable pastoral follow-up | Core to shepherding workflow |
| Visit / task logs | Record care activity and accountability | Operational record for assigned shepherds/admins |
| Push tokens | Optional digest notifications | Optional; users can decline OS permission |
| Audit events | Security and role-change traceability | Risk mitigation |

Public intake (visitors, prayer cards, event sign-ups) is **outside** this system by design; those processes remain
on congregation channels (office, email, website).

## 3. Lawful basis / justification

**Counsel to confirm** applicable POPIA grounds (e.g. consent, legitimate interest of responsible party, contractual
necessity with authorized users).

Religious affiliation may be inferable from membership and pastoral context — flag as potential **special personal
information**. Counsel must confirm whether explicit consent or other grounds apply.

## 4. Special personal information assessment

| Factor | Assessment |
| --- | --- |
| Religious belief inference | Possible from membership + pastoral notes |
| Explicit religion fields in app | None in v1 |
| Access restriction | RLS + role/assignment; inactive users blocked |
| Counsel sign-off required | Yes |

## 5. Operators and cross-border transfers

| Operator | Role | Data location (confirm with vendor) |
| --- | --- | --- |
| Supabase | Database, auth, RLS | Region selected at project creation (e.g. EU) |
| Cloudflare | Worker API, optional KV rate limits | Global edge; confirm DPA |
| Expo | Push notification delivery | Confirm DPA and transfer mechanism |

Responsible party must maintain operator agreements and transfer assessments.

## 6. Risks and mitigations

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Unauthorized access (inactive user, RLS gap) | High | Low (after hardening) | `is_active_user()`, RLS, live RLS tests, Worker auth |
| Public signup bypass | High | Low | Disable Supabase signup; inactive default profiles |
| Over-collection | Medium | Low | No prayer/event/public forms in v1; field minimization |
| Token / digest misuse | Medium | Low | Owner-only digest; cron secret; audit logs |
| Device loss | Medium | Medium | Secure session storage; sign-out; device policies |

## 7. Retention and deletion

See [retention-schedule.md](./retention-schedule.md). Counsel and Information Officer must align periods with
congregation policy.

## 8. Out-of-scope processing (documented exclusion)

The following are **not** processed by MyShepherdLine v1:

- Public visitor registration
- Prayer request submission
- Event / public web forms
- CSV bulk export to third parties
- Multi-church public onboarding

If added later, require a new impact assessment and legal review.

## 9. Decision (counsel completes)

- [ ] Proceed with controls as documented
- [ ] Proceed with conditions (list below)
- [ ] Do not proceed

Conditions:

Sign-off: see [legal-review-signoff.md](./legal-review-signoff.md)
