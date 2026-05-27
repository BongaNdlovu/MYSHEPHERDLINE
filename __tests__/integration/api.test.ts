import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkWorkerHealth, fetchReportSummary, registerPushToken } from '@/lib/core/api';

vi.mock('@/lib/core/env', () => ({
  getAppEnv: () => ({
    supabaseUrl: 'https://abc.supabase.co',
    supabasePublishableKey: 'key',
    workerApiUrl: 'https://worker.test.dev',
  }),
}));

describe('api integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns structured failure when report fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 503 } as Response);
    await expect(fetchReportSummary('token')).resolves.toEqual({ ok: false, reason: 'server' });
  });

  it('rejects malformed report payloads', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ tasksOpen: 'bad' }),
    } as Response);
    await expect(fetchReportSummary('token')).resolves.toEqual({ ok: false, reason: 'invalid_response' });
  });

  it('returns summary on successful report fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        tasksOpen: 2,
        membersNeedingAttention: 1,
        visitsCompleted: 4,
        recentActivityDays: 7,
        visitBreakdown: { visits: 1, calls: 1, bibleStudies: 1, newConverts: 1 },
      }),
    } as Response);
    const summary = await fetchReportSummary('token');
    expect(summary.ok).toBe(true);
    if (summary.ok) {
      expect(summary.data.tasksOpen).toBe(2);
    }
  });

  it('registers push token and surfaces worker errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);
    const result = await registerPushToken('token', 'ExpoPushToken[abc]', 'Pixel');
    expect(result.error?.category).toBe('auth');
  });

  it('checks worker health', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    } as Response);
    await expect(checkWorkerHealth()).resolves.toBe(true);
  });
});
