import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();

vi.mock('@/lib/core/supabase', () => ({
  requireSupabase: () => ({ from: fromMock }),
}));

describe('access requests service', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('submits access requests with trimmed values and empty messages as null', async () => {
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'req-1',
        email: 'new@church.test',
        display_name: 'New Shepherd',
        preferred_district_id: 'district-1',
        preferred_organization_id: 'org-1',
        message: null,
        status: 'pending',
      },
      error: null,
    });
    fromMock.mockReturnValue({ insert, select, single });

    const { submitAccessRequest } = await import('@/features/account/services/profile-preferences.service');

    const result = await submitAccessRequest({
      email: '  new@church.test  ',
      displayName: '  New Shepherd  ',
      preferredDistrictId: 'district-1',
      preferredOrganizationId: 'org-1',
      message: '   ',
    });

    expect(insert).toHaveBeenCalledWith({
      email: 'new@church.test',
      display_name: 'New Shepherd',
      preferred_district_id: 'district-1',
      preferred_organization_id: 'org-1',
      message: null,
      status: 'pending',
    });
    expect(result.status).toBe('pending');
  });

  it('loads pending requests with district and congregation labels', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'access_requests') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: 'req-1',
                    email: 'new@church.test',
                    display_name: 'New Shepherd',
                    preferred_district_id: 'district-1',
                    preferred_organization_id: 'org-1',
                    message: 'Elder role',
                    status: 'pending',
                    created_at: '2026-05-27T10:00:00.000Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'districts') {
        return {
          select: () => ({
            in: async () => ({ data: [{ id: 'district-1', name: 'Durban District' }], error: null }),
          }),
        };
      }
      if (table === 'organizations') {
        return {
          select: () => ({
            in: async () => ({ data: [{ id: 'org-1', name: 'Central Church' }], error: null }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { fetchPendingAccessRequests } = await import(
      '@/features/account/services/profile-preferences.service'
    );

    const result = await fetchPendingAccessRequests();
    expect(result).toHaveLength(1);
    expect(result[0].districtName).toBe('Durban District');
    expect(result[0].organizationName).toBe('Central Church');
    expect(result[0].email).toBe('new@church.test');
  });
});
