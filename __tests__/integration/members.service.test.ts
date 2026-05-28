import { beforeEach, describe, expect, it, vi } from 'vitest';

const insert = vi.fn();
const select = vi.fn();
const single = vi.fn();
const requireSupabase = vi.fn();
const getCurrentOrganizationId = vi.fn();
const order = vi.fn();
const range = vi.fn();
const eq = vi.fn();
const is = vi.fn();

vi.mock('@/lib/core/supabase', () => ({
  requireSupabase,
}));

vi.mock('@/lib/core/tenant', () => ({
  getCurrentOrganizationId,
}));

function createMembersQueryBuilder() {
  const builder = {
    select,
    order,
    range,
    eq,
    is,
    or: vi.fn(() => builder),
    then: (
      resolve: (value: { data: unknown[]; error: null }) => void,
      reject?: (reason: unknown) => void,
    ) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
  };

  select.mockReturnValue(builder);
  order.mockReturnValue(builder);
  range.mockReturnValue(builder);
  eq.mockReturnValue(builder);
  is.mockReturnValue(builder);

  return builder;
}

describe('members service', () => {
  beforeEach(() => {
    insert.mockReset();
    select.mockReset();
    single.mockReset();
    requireSupabase.mockReset();
    getCurrentOrganizationId.mockReset();
    order.mockReset();
    range.mockReset();
    eq.mockReset();
    is.mockReset();

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
      care_stage: 'new',
      notes: 'Met at service',
      assigned_to: 'shepherd-1',
    });
  });

  it('fetchMembersPage filters by assignedTo when provided', async () => {
    createMembersQueryBuilder();
    requireSupabase.mockReturnValue({ from: vi.fn(() => createMembersQueryBuilder()) });

    const { fetchMembersPage } = await import('@/features/members/services/members.service');

    await fetchMembersPage({ assignedTo: 'admin-1' });

    expect(eq).toHaveBeenCalledWith('assigned_to', 'admin-1');
  });

  it('fetchMembersPage filters by notContacted when provided', async () => {
    createMembersQueryBuilder();
    requireSupabase.mockReturnValue({ from: vi.fn(() => createMembersQueryBuilder()) });

    const { fetchMembersPage } = await import('@/features/members/services/members.service');

    await fetchMembersPage({ notContacted: true });

    expect(is).toHaveBeenCalledWith('last_contact_at', null);
  });
});
