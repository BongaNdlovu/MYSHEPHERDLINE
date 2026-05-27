import { describe, expect, it } from 'vitest';

import { parseHealthStatus, parseReportSummary } from '@/lib/core/worker-schemas';

describe('worker JSON schemas', () => {
  it('parses a valid report summary', () => {
    const summary = parseReportSummary({
      membersNeedingAttention: 2,
      visitsCompleted: 5,
      tasksOpen: 3,
      recentActivityDays: 7,
      visitBreakdown: { visits: 1, calls: 1, bibleStudies: 1, newConverts: 0 },
    });

    expect(summary?.tasksOpen).toBe(3);
  });

  it('rejects malformed report summaries', () => {
    expect(parseReportSummary({ tasksOpen: 'bad' })).toBeNull();
    expect(parseReportSummary(null)).toBeNull();
  });

  it('parses health status payloads', () => {
    expect(parseHealthStatus({ status: 'healthy' })).toBe('healthy');
    expect(parseHealthStatus({ status: 1 })).toBeNull();
  });
});
