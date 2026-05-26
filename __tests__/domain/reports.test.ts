import { describe, expect, it } from 'vitest';

import { buildReportSummary } from '@/features/reports/selectors/reports';
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
});
