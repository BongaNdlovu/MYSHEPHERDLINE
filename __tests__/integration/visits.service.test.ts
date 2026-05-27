import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const requireSupabase = vi.fn();

vi.mock('@/lib/core/supabase', () => ({
  requireSupabase,
}));

describe('visits service', () => {
  beforeEach(() => {
    rpc.mockReset();
    requireSupabase.mockReset();
    requireSupabase.mockReturnValue({ rpc });
  });

  it('logs visits atomically via the log_visit RPC', async () => {
    rpc.mockResolvedValue({ error: null });

    const { createVisit } = await import('@/features/visits/services/visits.service');

    await createVisit({
      memberId: 'member-1',
      userId: 'user-1',
      visitType: 'visit',
      notes: 'Checked in',
      followUpRequired: true,
    });

    expect(rpc).toHaveBeenCalledWith('log_visit', {
      p_member_id: 'member-1',
      p_visit_type: 'visit',
      p_notes: 'Checked in',
      p_follow_up_required: true,
    });
  });

  it('maps deactivated accounts to an auth error', async () => {
    rpc.mockResolvedValue({ error: { message: 'Account deactivated' } });

    const { createVisit } = await import('@/features/visits/services/visits.service');

    await expect(
      createVisit({
        memberId: 'member-1',
        userId: 'user-1',
        visitType: 'call',
        notes: '',
        followUpRequired: false,
      }),
    ).rejects.toMatchObject({
      category: 'auth',
      message: 'Your account is deactivated. Contact your administrator.',
    });
  });

  it('maps missing members to a not_found error', async () => {
    rpc.mockResolvedValue({ error: { message: 'Member not found' } });

    const { createVisit } = await import('@/features/visits/services/visits.service');

    await expect(
      createVisit({
        memberId: 'missing',
        userId: 'user-1',
        visitType: 'visit',
        notes: '',
        followUpRequired: false,
      }),
    ).rejects.toMatchObject({
      category: 'not_found',
      message: 'Member not found.',
    });
  });

  it('surfaces RPC failures with a friendly message', async () => {
    rpc.mockResolvedValue({
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
