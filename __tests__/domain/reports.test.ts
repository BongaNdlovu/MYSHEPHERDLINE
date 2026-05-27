import { describe, expect, it } from 'vitest';

import {
  buildRecentReportSummary,
  buildReportSummary,
  resolveReportFailure,
} from '@/features/reports/selectors/reports';
import { fixtureMembers, fixtureTasks, fixtureVisits } from '@/__tests__/fixtures/demo-data';

describe('reports domain', () => {
  it('derives new converts from recent member status, not visit type', () => {
    const summary = buildReportSummary({
      members: fixtureMembers,
      visits: fixtureVisits,
      tasks: fixtureTasks,
      recentActivityDays: 7,
    });

    expect(summary.visitBreakdown.newConverts).toBe(1);
    expect(summary.visitBreakdown.calls).toBe(1);
    expect(summary.visitBreakdown.visits).toBe(1);
    expect(summary.tasksOpen).toBe(2);
  });

  it('excludes older new-status members outside the recent window', () => {
    const summary = buildReportSummary({
      members: [
        ...fixtureMembers,
        {
          ...fixtureMembers[1],
          id: '3',
          full_name: 'Old Convert',
          created_at: '2020-01-01T00:00:00.000Z',
        },
      ],
      visits: fixtureVisits,
      tasks: fixtureTasks,
      recentActivityDays: 7,
    });

    expect(summary.visitBreakdown.newConverts).toBe(1);
  });

  it('builds summaries from compact fallback inputs', () => {
    const summary = buildRecentReportSummary({
      membersNeedingAttention: 3,
      recentVisits: fixtureVisits.map((visit) => ({
        visit_type: visit.visit_type,
        visited_at: visit.visited_at,
      })),
      tasksOpen: 7,
      newConverts: 2,
      recentActivityDays: 14,
    });

    expect(summary.membersNeedingAttention).toBe(3);
    expect(summary.visitsCompleted).toBe(2);
    expect(summary.tasksOpen).toBe(7);
    expect(summary.visitBreakdown.newConverts).toBe(2);
    expect(summary.recentActivityDays).toBe(14);
  });

  it('does not allow auth failures to fall back to local report aggregation', () => {
    const result = resolveReportFailure({ ok: false, reason: 'auth' }, true);

    expect(result.shouldUseFallback).toBe(false);
    expect(result.workerUnavailable).toBe(false);
    expect(result.error?.category).toBe('auth');
  });

  it('allows network failures to fall back and mark the worker as unavailable', () => {
    const result = resolveReportFailure({ ok: false, reason: 'network' }, true);

    expect(result.shouldUseFallback).toBe(true);
    expect(result.workerUnavailable).toBe(true);
    expect(result.error).toBeNull();
  });
});
