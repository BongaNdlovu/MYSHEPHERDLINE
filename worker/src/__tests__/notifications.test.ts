import { describe, expect, it, vi } from 'vitest';

import {
  listDigestOrganizationIds,
  parseRegisterPayload,
  registerToken,
  sendDigest,
  sendDigestForOrganization,
  sendExpoPushBatch,
} from '../notifications';

vi.mock('../reports', () => ({
  buildSummary: vi.fn().mockResolvedValue({
    membersNeedingAttention: 2,
    visitsCompleted: 5,
    tasksOpen: 3,
    recentActivityDays: 7,
    visitBreakdown: { visits: 1, calls: 1, bibleStudies: 1, newConverts: 0 },
  }),
}));

describe('notification payload validation', () => {
  it('rejects malformed bodies', () => {
    expect(parseRegisterPayload(null)).toEqual({ error: 'Invalid JSON body' });
    expect(parseRegisterPayload({})).toEqual({ error: 'expoPushToken is required' });
    expect(parseRegisterPayload({ expoPushToken: 'bad' })).toEqual({ error: 'expoPushToken format is invalid' });
  });

  it('accepts valid expo tokens', () => {
    expect(parseRegisterPayload({ expoPushToken: 'ExpoPushToken[abc]', deviceName: 'Pixel 8' })).toEqual({
      expoPushToken: 'ExpoPushToken[abc]',
      deviceName: 'Pixel 8',
    });
  });
});

describe('registerToken error mapping', () => {
  it('maps duplicate errors to 409', async () => {
    const supabase = {
      from: () => ({
        upsert: async () => ({ error: { message: 'duplicate key value violates unique constraint 23505' } }),
      }),
    };

    const result = await registerToken(supabase as never, 'user-1', 'org-1', {
      expoPushToken: 'ExpoPushToken[abc]',
      deviceName: 'Pixel',
    });

    expect(result).toEqual({ error: 'Push token already registered', status: 409 });
  });
});

describe('expo push batching', () => {
  it('chunks requests above 100 tokens', async () => {
    const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? '[]')) as unknown[];
      return {
        ok: true,
        json: async () => ({ data: Array.from({ length: body.length }, () => ({ status: 'ok' })) }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const tokens = Array.from({ length: 150 }, (_, index) => `ExpoPushToken[${index}]`);
    const result = await sendExpoPushBatch(tokens, {
      membersNeedingAttention: 1,
      visitsCompleted: 1,
      tasksOpen: 1,
      recentActivityDays: 7,
      visitBreakdown: { visits: 0, calls: 0, bibleStudies: 0, newConverts: 0 },
    });

    expect(result).toEqual({ requested: 150, sent: 150, failed: 0, batches: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('returns an error when Expo responds with non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendExpoPushBatch(['ExpoPushToken[a]'], {
      membersNeedingAttention: 1,
      visitsCompleted: 1,
      tasksOpen: 1,
      recentActivityDays: 7,
      visitBreakdown: { visits: 0, calls: 0, bibleStudies: 0, newConverts: 0 },
    });

    expect(result).toEqual({ error: 'Expo push API returned 429' });
    vi.unstubAllGlobals();
  });
});

describe('per-organization digest', () => {
  it('lists distinct organization ids from active push tokens', async () => {
    const supabase = {
      from() {
        return {
          select: () => ({
            eq: async () => ({
              data: [
                { organization_id: 'org-1' },
                { organization_id: 'org-1' },
                { organization_id: 'org-2' },
              ],
            }),
          }),
        };
      },
    };

    const result = await listDigestOrganizationIds(supabase as never);
    expect(result.organizationIds).toEqual(['org-1', 'org-2']);
  });

  it('sends one summary per organization and counts successful deliveries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: 'ok' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const supabase = {
      from(table: string) {
        if (table === 'push_tokens') {
          return {
            select: () => ({
              eq: async () => ({
                data: [
                  { organization_id: 'org-1', expo_push_token: 'ExpoPushToken[a]' },
                  { organization_id: 'org-2', expo_push_token: 'ExpoPushToken[b]' },
                ],
              }),
            }),
          };
        }
        return { select: () => ({ eq: async () => ({ data: [] }) }) };
      },
      rpc: async () => ({ data: {}, error: null }),
    };

    const result = await sendDigest(supabase as never, { RECENT_ACTIVITY_DAYS: '7' } as never);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.organizations).toBe(2);
      expect(result.sent).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.results[0].pushDelivery).toEqual({ requested: 1, sent: 1, failed: 0, batches: 1 });
    }

    vi.unstubAllGlobals();
  });

  it('skips expo call when an organization has no tokens', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendDigestForOrganization(
      { rpc: async () => ({ data: {}, error: null }) } as never,
      { RECENT_ACTIVITY_DAYS: '7' } as never,
      'org-empty',
      [],
    );

    expect(result.tokenCount).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
