import { describe, expect, it } from 'vitest';

import { buildReportSummary } from '@/features/reports/selectors/reports';
import { fixtureMembers, fixtureTasks, fixtureVisits } from '@/__tests__/fixtures/demo-data';

describe('reports domain', () => {
  it('derives new converts from member status, not visit type', () => {
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
});
