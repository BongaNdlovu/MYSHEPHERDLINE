import { describe, expect, it, vi } from 'vitest';

import {
  listDigestOrganizationIds,
  parseRegisterPayload,
  sendDigest,
  sendDigestForOrganization,
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

  it('sends one summary per organization', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) });
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
