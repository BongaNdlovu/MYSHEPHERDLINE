# Personal Information Impact Assessment Template (Draft)

## 1. Processing description

- System: MyShepherdLine
- Data subjects: congregation members (adults), authorized shepherds/admins
- Data categories: identity, contact details, pastoral care metadata, visit/task logs, push tokens

## 2. Purpose and necessity

Describe why each category is required for pastoral care workflows.

## 3. Lawful basis / justification

Document consent, contract, legitimate interest, or other applicable POPIA grounds. Flag religious-context sensitivity.

## 4. Special personal information assessment

Assess whether congregation membership or pastoral notes reveal religious belief or other special personal information.

## 5. Operators and cross-border transfers

List Supabase, Cloudflare, Expo and hosting locations. Document safeguards.

## 6. Risks and mitigations

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Unauthorized access | High | Medium | RLS, role checks, Worker auth |
| Over-collection | Medium | Medium | Field minimization, no prayer/health notes in v1 |
| Token misuse | Medium | Low | Admin-only digest, token validation |

## 7. Retention and deletion

Reference retention schedule.

## 8. Decision

- [ ] Proceed with controls
- [ ] Proceed with conditions
- [ ] Do not proceed

For a pre-filled internal-tool draft, see [impact-assessment-internal-tool.md](./impact-assessment-internal-tool.md).

Sign-off: [legal-review-signoff.md](./legal-review-signoff.md)
