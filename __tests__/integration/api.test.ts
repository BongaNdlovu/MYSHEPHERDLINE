import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkWorkerHealth, fetchReportSummary, registerPushToken } from '@/lib/api';

vi.mock('@/lib/config/env', () => ({
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

  it('returns null when report fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    await expect(fetchReportSummary('token')).resolves.toBeNull();
  });

  it('returns summary on successful report fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ tasksOpen: 2, membersNeedingAttention: 1 }),
    } as Response);
    const summary = await fetchReportSummary('token');
    expect(summary?.tasksOpen).toBe(2);
  });

  it('registers push token and surfaces worker errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);
    const result = await registerPushToken('token', 'ExpoPushToken[abc]', 'Pixel');
    expect(result.error).toBe('Unauthorized');
  });

  it('checks worker health', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    } as Response);
    await expect(checkWorkerHealth()).resolves.toBe(true);
  });
});
