# Legal & Compliance Review Sign-off (Template)

**Do not mark production-ready until a qualified POPIA/PAIA practitioner completes this form.**

This template records counsel review of MyShepherdLine as an **internal shepherd tool** for one congregation. It does
not constitute legal advice.

---

## 1. Engagement details

| Field | Value |
| --- | --- |
| Congregation / responsible party | |
| Legal entity registration (if applicable) | |
| App version / git tag reviewed | |
| Review date | |
| Reviewer name & firm | |
| Reviewer role | ☐ Legal counsel ☐ Information Officer ☐ Both |

## 2. Product scope acknowledged

Reviewer confirms understanding that v1 **excludes** public-facing flows:

- [ ] Public visitor registration — out of scope; handled outside the app
- [ ] Public contact intake — out of scope; internal member CRUD only
- [ ] Prayer requests — out of scope
- [ ] Events / public forms — out of scope
- [ ] CSV / bulk export — out of scope
- [ ] Multi-church self-serve onboarding — out of scope (single default org)

Reference: [product-scope.md](../product-scope.md)

## 3. Documents reviewed

- [ ] In-app Privacy Policy (`features/legal/screens/PrivacyScreen.tsx`)
- [ ] In-app Terms (`features/legal/screens/TermsScreen.tsx`)
- [ ] [impact-assessment-internal-tool.md](./impact-assessment-internal-tool.md)
- [ ] [retention-schedule.md](./retention-schedule.md)
- [ ] [paia-manual.md](./paia-manual.md)
- [ ] [data-subject-requests.md](./data-subject-requests.md)
- [ ] [breach-runbook.md](./breach-runbook.md)
- [ ] Technical controls: [production-hardening.md](../security/production-hardening.md)

## 4. Findings

| # | Finding | Severity | Remediation | Status |
| --- | --- | --- | --- | --- |
| 1 | | ☐ Blocker ☐ Condition ☐ Note | | |
| 2 | | | | |

## 5. Lawful basis & special personal information

- [ ] Lawful basis documented for shepherd accounts and member pastoral records
- [ ] Religious-context / special personal information risk assessed and accepted or mitigated
- [ ] Cross-border transfer safeguards confirmed for Supabase / Cloudflare / Expo hosting

## 6. Decision

Select one:

- [ ] **Approved for production** — no blockers; conditions listed above are acceptable or completed
- [ ] **Approved with conditions** — production allowed after listed remediations
- [ ] **Not approved** — do not launch until blockers resolved

Conditions (if any):

1.
2.

## 7. Signatures

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Legal counsel | | | |
| Information Officer | | | |
| Congregation leadership | | | |

---

Store completed PDF or signed copy outside the git repo (congregation records). Optionally commit a redacted
`legal-review-signoff.completed.md` with dates and approver names only — never privileged legal advice text.
