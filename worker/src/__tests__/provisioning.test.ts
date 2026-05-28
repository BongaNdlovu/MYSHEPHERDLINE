import { beforeEach, describe, expect, it, vi } from 'vitest';

import { inviteAccessRequest, parseInvitePayload } from '../provisioning';

describe('parseInvitePayload', () => {
  it('requires accessRequestId', () => {
    expect(parseInvitePayload({})).toEqual({ error: 'accessRequestId is required' });
    expect(parseInvitePayload({ accessRequestId: '  ' })).toEqual({ error: 'accessRequestId is required' });
  });

  it('accepts a trimmed id', () => {
    expect(parseInvitePayload({ accessRequestId: ' abc ' })).toEqual({ accessRequestId: 'abc' });
  });
});

describe('inviteAccessRequest', () => {
  const requestContext = { requestId: 'req-1', method: 'POST', path: '/admin/access-requests/invite' };
  const adminAuth = {
    userId: 'owner-1',
    organizationId: 'org-1',
    role: 'admin' as const,
    email: 'admin@test.local',
    isActive: true as const,
  };

  const inviteUserByEmail = vi.fn();
  const from = vi.fn();
  const supabase = {
    from,
    auth: { admin: { inviteUserByEmail } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    inviteUserByEmail.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it('rejects non-admin callers', async () => {
    const result = await inviteAccessRequest(
      supabase as never,
      { ...adminAuth, role: 'shepherd' },
      'req-1',
      requestContext,
    );
    expect(result).toEqual({ error: 'Forbidden', status: 403 });
  });

  it('invites and marks the request reviewed', async () => {
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'req-1',
            email: 'Shepherd@Example.com',
            display_name: 'Test Shepherd',
            preferred_organization_id: 'org-1',
            preferred_district_id: 'dist-1',
            status: 'pending',
          },
          error: null,
        }),
      }),
    });
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    from.mockImplementation((table: string) => {
      if (table === 'access_requests') {
        return { select, update };
      }
      if (table === 'profiles') {
        return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) };
      }
      return { select, update };
    });

    const result = await inviteAccessRequest(supabase as never, adminAuth, 'req-1', requestContext);

    expect(result).toEqual({ ok: true, email: 'shepherd@example.com' });
    expect(inviteUserByEmail).toHaveBeenCalledWith(
      'shepherd@example.com',
      expect.objectContaining({
        redirectTo: 'myshepherdline://sign-in',
        data: expect.objectContaining({
          organization_id: 'org-1',
          display_name: 'Test Shepherd',
        }),
      }),
    );
  });

  it('surfaces profile update failures after sending the invite', async () => {
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'req-1',
            email: 'Shepherd@Example.com',
            display_name: 'Test Shepherd',
            preferred_organization_id: 'org-1',
            preferred_district_id: 'dist-1',
            status: 'pending',
          },
          error: null,
        }),
      }),
    });
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    from.mockImplementation((table: string) => {
      if (table === 'access_requests') {
        return { select, update };
      }
      if (table === 'profiles') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'profile update failed' } }),
          }),
        };
      }
      return { select, update };
    });

    const result = await inviteAccessRequest(supabase as never, adminAuth, 'req-1', requestContext);
    expect(result).toEqual({ error: 'Invitation sent but profile setup failed', status: 500 });
  });

  function mockRequest(preferredOrgId: string) {
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'req-1',
            email: 'Shepherd@Example.com',
            display_name: 'Test Shepherd',
            preferred_organization_id: preferredOrgId,
            preferred_district_id: 'dist-1',
            status: 'pending',
          },
          error: null,
        }),
      }),
    });
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) };
      }
      return { select, update };
    });
  }

  it('rejects admins inviting for another organization', async () => {
    mockRequest('org-2');
    const result = await inviteAccessRequest(supabase as never, adminAuth, 'req-1', requestContext);
    expect(result).toEqual({ error: 'Forbidden', status: 403 });
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it('allows owners to invite across organizations', async () => {
    mockRequest('org-2');
    const ownerAuth = { ...adminAuth, role: 'owner' as const };
    const result = await inviteAccessRequest(supabase as never, ownerAuth, 'req-1', requestContext);
    expect(result).toEqual({ ok: true, email: 'shepherd@example.com' });
    expect(inviteUserByEmail).toHaveBeenCalled();
  });
});
