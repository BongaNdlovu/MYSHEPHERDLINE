import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const insert = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const from = vi.fn();
const requireSupabase = vi.fn();

vi.mock('@/lib/core/supabase', () => ({
  requireSupabase,
}));

describe('visits service', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    insert.mockReset();
    update.mockReset();
    eq.mockReset();
    select.mockReset();
    from.mockReset();
    requireSupabase.mockReset();

    const membersQuery = {
      select,
    };
    const visitsQuery = {
      insert,
    };
    const memberUpdateQuery = {
      update,
    };

    select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle,
      }),
    });
    insert.mockResolvedValue({ error: null });
    update.mockReturnValue({
      eq,
    });
    eq.mockResolvedValue({ error: null });
    from.mockImplementation((table: string) => {
      if (table === 'members') return membersQuery;
      if (table === 'visits') return visitsQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    requireSupabase.mockReturnValue({
      from: (table: string) => {
        if (table === 'members' && select.mock.calls.length === 0) return membersQuery;
        if (table === 'members') return memberUpdateQuery;
        return from(table);
      },
    });
  });

  it('surfaces member lookup failures instead of reporting a missing member', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'JWT expired', status: 401, code: '401' },
    });

    const { createVisit } = await import('@/features/visits/services/visits.service');

    await expect(
      createVisit({
        memberId: 'member-1',
        userId: 'user-1',
        visitType: 'visit',
        notes: '',
        followUpRequired: false,
      }),
    ).rejects.toMatchObject({
      category: 'auth',
      message: 'Your session expired. Sign in again.',
    });
  });
});
