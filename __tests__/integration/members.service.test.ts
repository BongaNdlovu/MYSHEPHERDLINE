import { beforeEach, describe, expect, it, vi } from 'vitest';

const insert = vi.fn();
const select = vi.fn();
const single = vi.fn();
const requireSupabase = vi.fn();
const getCurrentOrganizationId = vi.fn();

vi.mock('@/lib/core/supabase', () => ({
  requireSupabase,
}));

vi.mock('@/lib/core/tenant', () => ({
  getCurrentOrganizationId,
}));

describe('members service', () => {
  beforeEach(() => {
    insert.mockReset();
    select.mockReset();
    single.mockReset();
    requireSupabase.mockReset();
    getCurrentOrganizationId.mockReset();

    single.mockReturnValue({ data: { id: 'member-1' }, error: null });
    select.mockReturnValue({ single });
    insert.mockReturnValue({ select });
    requireSupabase.mockReturnValue({ from: vi.fn(() => ({ insert })) });
    getCurrentOrganizationId.mockResolvedValue('org-1');
  });

  it('createMemberAsShepherd assigns the member to the signed-in shepherd', async () => {
    const { createMemberAsShepherd } = await import('@/features/members/services/members.service');

    await createMemberAsShepherd('shepherd-1', {
      full_name: ' Thabo Nkosi ',
      phone: '+27 82 111 2222',
      email: ' thabo@example.com ',
      notes: ' Met at service ',
    });

    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      full_name: 'Thabo Nkosi',
      phone: '+27 82 111 2222',
      email: 'thabo@example.com',
      address: null,
      risk_level: 'low',
      status: 'new',
      notes: 'Met at service',
      assigned_to: 'shepherd-1',
    });
  });
});
