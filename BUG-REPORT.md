# Bug Report Review - MyShepherdLine

**Reviewed:** 2026-05-28
**Status:** Corrected after source review and targeted test verification
**Scope:** `worker/`, shared app logic, and selected React screens/hooks

---

## Executive Summary

The original automated sweep was directionally useful, but it overstated several issues and incorrectly marked all 41
findings as verified. This reviewed report keeps the real defects, downgrades or removes false positives, and
identifies the fixes that were implemented from this review.

Targeted verification run:

- `npm run test:win -- __tests__/domain/attention.test.ts __tests__/security/supabase-storage.test.ts
  __tests__/integration/members.service.test.ts`

---

## Findings Confirmed And Fixed

### BUG-001: Cron secret comparison should use a timing-safe check

- **File:** `worker/src/auth.ts`
- **Status:** Fixed
- **Notes:** The code used direct string equality. Hardening to a timing-safe comparison is appropriate, although the
  original report overstated this as a proven auth bypass.

### BUG-002 / BUG-038: Rate limiting silently degrades when `RATE_LIMIT` is missing

- **Files:** `worker/src/env.ts`, `worker/src/index.ts`
- **Status:** Fixed
- **Notes:** The worker now treats a missing `RATE_LIMIT` binding as misconfiguration instead of silently falling
  back at runtime.

### BUG-005: Invitation flow ignored profile update failure

- **File:** `worker/src/provisioning.ts`
- **Status:** Fixed
- **Notes:** The profile update result is now checked before the access request is marked reviewed.

### BUG-008: Unsafe KV JSON parsing in rate limiter

- **File:** `worker/src/rate-limit.ts`
- **Status:** Fixed
- **Notes:** Corrupt KV values are now treated as expired buckets instead of throwing.

### BUG-009: Rate limit key was split per route

- **File:** `worker/src/index.ts`
- **Status:** Fixed
- **Notes:** The key no longer includes the request path, so the limit applies per client instead of
  per client-per-endpoint.

### BUG-010 / BUG-028: Fire-and-forget push registration lacked rejection handling

- **File:** `lib/core/auth.tsx`
- **Status:** Fixed
- **Notes:** The non-null assertion was removed and the promise chain now has a `.catch()` path that clears
  in-flight state.

### BUG-012: Worker responses were missing basic hardening headers

- **File:** `worker/src/http.ts`
- **Status:** Fixed
- **Notes:** Added `X-Content-Type-Options`, `X-Frame-Options`, and `Strict-Transport-Security`.

### BUG-013: Misconfiguration response leaked internal env names

- **File:** `worker/src/index.ts`
- **Status:** Fixed
- **Notes:** External responses are now sanitized. Missing bindings are still logged internally for cron
  diagnostics.

### BUG-014: `AdminReportsScreen` could set state after unmount

- **File:** `features/admin/screens/AdminReportsScreen.tsx`
- **Status:** Fixed

### BUG-015: `useAdminEditForm` did not rehydrate when editing a different entity

- **File:** `features/admin/hooks/useAdminEditForm.ts`
- **Status:** Fixed

### BUG-018: `memberNeedsAttention()` ignored overdue task context

- **File:** `lib/core/member-attention.ts`
- **Status:** Fixed
- **Notes:** The helper now accepts an optional task list.

### BUG-019: Date-only parsing used local midnight

- **File:** `features/tasks/selectors/tasks.ts`
- **Status:** Fixed
- **Notes:** The due-date formatter now parses the normalized key as UTC.

### BUG-025: Reminder batch parsing assumed valid JSON

- **File:** `worker/src/notifications.ts`
- **Status:** Fixed

### BUG-026: Wrong-method requests returned 404 instead of 405

- **File:** `worker/src/index.ts`
- **Status:** Fixed

---

## Findings Reviewed But Not Supported As Written

### BUG-003: Supabase `.or()` chaining does not overwrite the previous `.or()`

- **Status:** Not confirmed
- **Reason:** The installed `@supabase/postgrest-js` implementation appends repeated `.or()` params instead of
  replacing them.

### BUG-004: `hasMorePages(count >= pageSize)` is not fixable by changing it to `>`

- **Status:** Partially confirmed, proposed fix rejected
- **Reason:** The current logic can produce one extra fetch when a page is exactly full, but switching to `>`
  would hide legitimate next pages in this pagination model.

### BUG-006 / BUG-007: Button lockups on thrown exceptions

- **Status:** Not confirmed
- **Reason:** `signIn()` and push registration already catch and return structured errors, so the
  specific thrown-exception path described by the report is not supported by current source.

### BUG-011: `localStorage` on web is a tradeoff, but `sessionStorage` is not an XSS fix

- **Status:** Overstated
- **Reason:** Web storage remains script-readable either way. This is a security posture decision, not a
  straightforward vulnerability fix.

### BUG-022: `RECENT_ACTIVITY_DAYS=0`

- **Status:** Not treated as a bug
- **Reason:** Existing worker tests explicitly document zero as an intentional accepted value.

### BUG-024: Reminder cron every 15 minutes

- **Status:** Not confirmed
- **Reason:** `worker/wrangler.toml` explicitly configures both `0 8 * * *` and `*/15 * * * *`, so the schedule
  appears intentional.

### BUG-027: `buildAttentionPreview(members, 4)` overload

- **Status:** Not confirmed
- **Reason:** This calling pattern is covered by tests and is intentional in the current API.

---

## Remaining Lower-Priority Items

The original report also included several lower-priority maintainability and observability notes that were not
part of this patch:

- Broad runtime validation of Supabase result shapes
- Typed replacement for `Record<string, unknown>` patch objects
- More granular app-facing error surfacing
- Additional component-level error boundaries
- Minor render-performance cleanups

These may still be worth addressing, but they were not all verified as defects requiring immediate change.

---

## Summary

- **Original report claim:** 41/41 findings verified
- **Reviewed conclusion:** Mixed accuracy; multiple false positives and a few incorrect remediation
  suggestions
- **Implemented from this review:** 14 concrete source fixes across worker and app code

This file now reflects the reviewed state of the codebase rather than the original automated sweep output.
