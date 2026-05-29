import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();
const getUserMock = vi.fn();

vi.mock('@/lib/core/supabase', () => ({
  requireSupabase: () => ({ from: fromMock, auth: { getUser: getUserMock } }),
}));

vi.mock('@/lib/core/tenant', () => ({
  getCurrentOrganizationId: async () => 'org-1',
}));

describe('assignment requests service', () => {
  beforeEach(() => {
    fromMock.mockReset();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: 'shepherd-1' } }, error: null });
  });

  it('submits assignment requests with requested_by from the signed-in user', async () => {
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'req-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        task_id: null,
        requested_by: 'shepherd-1',
        reason: 'Need co-shepherd support',
        status: 'pending',
      },
      error: null,
    });
    fromMock.mockReturnValue({ insert, select, single });

    const { createAssignmentRequest } = await import(
      '@/features/assignment-requests/services/assignment-requests.service'
    );

    const result = await createAssignmentRequest({
      memberId: 'member-1',
      reason: 'Need co-shepherd support',
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        member_id: 'member-1',
        requested_by: 'shepherd-1',
        reason: 'Need co-shepherd support',
        status: 'pending',
      }),
    );
    expect(result.requested_by).toBe('shepherd-1');
  });

  it('loads pending requests with member, task, and requester labels', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'assignment_requests') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: 'req-1',
                    organization_id: 'org-1',
                    member_id: 'member-1',
                    task_id: 'task-1',
                    requested_by: 'shepherd-1',
                    reason: 'Reassign please',
                    status: 'pending',
                    reviewed_by: null,
                    reviewed_at: null,
                    created_at: '2026-05-27T10:00:00.000Z',
                    updated_at: '2026-05-27T10:00:00.000Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'members') {
        return {
          select: () => ({
            in: async () => ({ data: [{ id: 'member-1', full_name: 'Sipho Dlamini' }], error: null }),
          }),
        };
      }
      if (table === 'tasks') {
        return {
          select: () => ({
            in: async () => ({ data: [{ id: 'task-1', title: 'Follow up call' }], error: null }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({ data: [{ id: 'shepherd-1', display_name: 'Jane Shepherd' }], error: null }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { fetchPendingAssignmentRequests } = await import(
      '@/features/assignment-requests/services/assignment-requests.service'
    );

    const result = await fetchPendingAssignmentRequests();
    expect(result).toHaveLength(1);
    expect(result[0].memberName).toBe('Sipho Dlamini');
    expect(result[0].taskTitle).toBe('Follow up call');
    expect(result[0].requestedByName).toBe('Jane Shepherd');
  });
});
