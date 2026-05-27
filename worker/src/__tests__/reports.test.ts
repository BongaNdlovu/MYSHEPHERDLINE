import { describe, expect, it, vi } from 'vitest';

import { buildSummary, reportCacheKeyForTests, resetReportCache } from '../reports';

describe('worker report aggregation', () => {
  it('uses tenant-scoped RPC and caches per organization', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        membersNeedingAttention: 2,
        visitsCompleted: 5,
        tasksOpen: 3,
        recentActivityDays: 7,
        visitBreakdown: { visits: 2, calls: 2, bibleStudies: 1, newConverts: 1 },
      },
      error: null,
    });

    const supabase = { rpc };
    const context = {
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'shepherd' as const,
      email: 's@test.local',
      isActive: true as const,
    };

    const first = await buildSummary(supabase as never, { RECENT_ACTIVITY_DAYS: '7' } as never, context);
    const second = await buildSummary(supabase as never, { RECENT_ACTIVITY_DAYS: '7' } as never, context);

    expect(first.tasksOpen).toBe(3);
    expect(second.tasksOpen).toBe(3);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('worker_report_summary', {
      p_user_id: 'user-1',
      p_organization_id: 'org-1',
      p_role: 'shepherd',
      p_recent_days: 7,
    });
  });

  it('shares cache entries for admin and owner roles in the same org', () => {
    resetReportCache();
    const recentDays = 7;
    const adminKey = reportCacheKeyForTests(
      {
        userId: 'admin-1',
        organizationId: 'org-1',
        role: 'admin',
        email: 'a@test.local',
        isActive: true,
      },
      recentDays,
    );
    const ownerKey = reportCacheKeyForTests(
      {
        userId: 'owner-1',
        organizationId: 'org-1',
        role: 'owner',
        email: 'o@test.local',
        isActive: true,
      },
      recentDays,
    );

    expect(adminKey).toBe(ownerKey);
    expect(adminKey).toBe('global:org-1:7');
  });

  it('throws when RPC fails', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }),
    };

    await expect(
      buildSummary(supabase as never, { RECENT_ACTIVITY_DAYS: '7' } as never, {
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        email: 'a@test.local',
        isActive: true,
      }),
    ).rejects.toThrow('db down');
  });

  it('throws when RPC returns invalid summary shape', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: { tasksOpen: 'bad' }, error: null }),
    };

    await expect(
      buildSummary(supabase as never, { RECENT_ACTIVITY_DAYS: '7' } as never, {
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        email: 'a@test.local',
        isActive: true,
      }),
    ).rejects.toThrow('Report aggregation returned invalid data');
  });
});
