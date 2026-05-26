import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  hasGlobalScope,
  isInternalDigestRequest,
  isOwner,
  isValidExpoPushToken,
  normalizeRole,
  resolveAuth,
} from '../auth';

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: supabaseMocks.getUser,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: supabaseMocks.maybeSingle,
        }),
      }),
    }),
  }),
}));

describe('worker auth helpers', () => {
  it('validates expo push token format', () => {
    expect(isValidExpoPushToken('ExpoPushToken[abc123]')).toBe(true);
    expect(isValidExpoPushToken('invalid')).toBe(false);
  });

  it('detects internal digest secret', () => {
    const request = new Request('https://example.dev/notifications/send-digest', {
      headers: { 'X-Cron-Secret': 'secret-value' },
    });
    expect(isInternalDigestRequest(request, { DIGEST_CRON_SECRET: 'secret-value' } as never)).toBe(true);
  });

  it('checks global scope for admin and owner', () => {
    expect(
      hasGlobalScope({
        userId: '1',
        organizationId: 'org-1',
        role: 'admin',
        email: 'a@x.com',
        isActive: true,
      }),
    ).toBe(true);
    expect(
      hasGlobalScope({
        userId: '1',
        organizationId: 'org-1',
        role: 'owner',
        email: 'o@x.com',
        isActive: true,
      }),
    ).toBe(true);
    expect(
      hasGlobalScope({
        userId: '1',
        organizationId: 'org-1',
        role: 'shepherd',
        email: 's@x.com',
        isActive: true,
      }),
    ).toBe(false);
  });

  it('checks owner role', () => {
    expect(
      isOwner({
        userId: '1',
        organizationId: 'org-1',
        role: 'owner',
        email: 'o@x.com',
        isActive: true,
      }),
    ).toBe(true);
    expect(
      isOwner({
        userId: '1',
        organizationId: 'org-1',
        role: 'admin',
        email: 'a@x.com',
        isActive: true,
      }),
    ).toBe(false);
  });

  it('normalizes known roles case-insensitively and rejects unknown roles', () => {
    expect(normalizeRole('OWNER')).toBe('owner');
    expect(normalizeRole('Admin')).toBe('admin');
    expect(normalizeRole('shepherd')).toBe('shepherd');
    expect(normalizeRole('Administrator')).toBeNull();
    expect(normalizeRole(null)).toBeNull();
  });
});

describe('resolveAuth', () => {
  const env = {
    SUPABASE_URL: 'https://abc.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts lowercase bearer scheme', async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 's@test.local' } },
      error: null,
    });
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        role: 'shepherd',
        email: 's@test.local',
        is_active: true,
        organization_id: 'org-1',
      },
    });

    const request = new Request('https://worker.test/reports/summary', {
      headers: { Authorization: 'bearer valid-token' },
    });

    const auth = await resolveAuth(request, env);
    expect(auth).toMatchObject({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'shepherd',
    });
  });

  it('rejects inactive profiles', async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 's@test.local' } },
      error: null,
    });
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        role: 'shepherd',
        email: 's@test.local',
        is_active: false,
        organization_id: 'org-1',
      },
    });

    const request = new Request('https://worker.test/reports/summary', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    const auth = await resolveAuth(request, env);
    expect(auth).toEqual({ status: 'inactive', userId: 'user-1' });
  });

  it('rejects unknown roles', async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 's@test.local' } },
      error: null,
    });
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        role: 'Administrator',
        email: 's@test.local',
        is_active: true,
        organization_id: 'org-1',
      },
    });

    const request = new Request('https://worker.test/reports/summary', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    const auth = await resolveAuth(request, env);
    expect(auth).toEqual({ status: 'unauthorized' });
  });
});
