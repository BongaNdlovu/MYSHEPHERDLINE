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

  it('logs care actions atomically via the log_care_action RPC', async () => {
    rpc.mockResolvedValue({ error: null });

    const { createCareAction } = await import('@/features/visits/services/visits.service');

    await createCareAction({
      memberId: 'member-1',
      visitType: 'whatsapp',
      notes: 'Shared encouragement',
      followUpRequired: true,
      careStage: 'contacted',
      status: 'active',
      riskLevel: 'medium',
      memberNotes: 'Responded well',
      followUpTitle: 'Call Sipho',
      followUpDescription: 'Check in tomorrow',
      followUpDueDate: '2026-05-30',
      followUpDueAt: '2026-05-30T09:00:00.000Z',
      followUpPriority: 'high',
      followUpTaskType: 'call',
      followUpReminderMinutesBefore: 30,
    });

    expect(rpc).toHaveBeenCalledWith('log_care_action', {
      p_member_id: 'member-1',
      p_visit_type: 'whatsapp',
      p_notes: 'Shared encouragement',
      p_follow_up_required: true,
      p_status: 'active',
      p_risk_level: 'medium',
      p_care_stage: 'contacted',
      p_member_notes: 'Responded well',
      p_follow_up_title: 'Call Sipho',
      p_follow_up_description: 'Check in tomorrow',
      p_follow_up_due_date: '2026-05-30',
      p_follow_up_due_at: '2026-05-30T09:00:00.000Z',
      p_follow_up_priority: 'high',
      p_follow_up_task_type: 'call',
      p_follow_up_reminder_minutes_before: 30,
    });
  });

  it('fills care-action defaults when optional follow-up fields are omitted', async () => {
    rpc.mockResolvedValue({ error: null });

    const { createCareAction } = await import('@/features/visits/services/visits.service');

    await createCareAction({
      memberId: 'member-1',
      visitType: 'visit',
      notes: 'Checked in after service',
      followUpRequired: false,
    });

    expect(rpc).toHaveBeenCalledWith('log_care_action', {
      p_member_id: 'member-1',
      p_visit_type: 'visit',
      p_notes: 'Checked in after service',
      p_follow_up_required: false,
      p_status: null,
      p_risk_level: null,
      p_care_stage: null,
      p_member_notes: null,
      p_follow_up_title: null,
      p_follow_up_description: null,
      p_follow_up_due_date: null,
      p_follow_up_due_at: null,
      p_follow_up_priority: 'medium',
      p_follow_up_task_type: null,
      p_follow_up_reminder_minutes_before: 60,
    });
  });
});
