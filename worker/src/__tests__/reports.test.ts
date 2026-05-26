import { describe, expect, it } from 'vitest';

import { buildSummary } from '../reports';

describe('worker report aggregation', () => {
  it('scopes shepherd reports to assigned members and own visits/tasks', async () => {
    const supabase = {
      from(table: string) {
        if (table === 'members') {
          return {
            select: async () => ({
              data: [
                { id: 'm1', risk_level: 'high', status: 'inactive', assigned_to: 'user-1' },
                { id: 'm2', risk_level: 'low', status: 'active', assigned_to: 'user-2' },
                { id: 'm3', risk_level: 'low', status: 'active', assigned_to: null },
              ],
            }),
          };
        }
        if (table === 'visits') {
          return {
            select: () => ({
              gte: async () => ({
                data: [
                  { visit_type: 'call', visited_at: new Date().toISOString(), logged_by: 'user-1', member_id: 'm1' },
                  { visit_type: 'visit', visited_at: new Date().toISOString(), logged_by: 'user-2', member_id: 'm2' },
                  { visit_type: 'visit', visited_at: new Date().toISOString(), logged_by: 'user-1', member_id: 'm3' },
                ],
              }),
            }),
          };
        }
        return {
          select: async () => ({
            data: [
              { status: 'open', assignee_id: 'user-1' },
              { status: 'open', assignee_id: 'user-2' },
              { status: 'open', assignee_id: null },
            ],
          }),
        };
      },
    };

    const summary = await buildSummary(supabase as never, { RECENT_ACTIVITY_DAYS: '7' } as never, {
      userId: 'user-1',
      role: 'shepherd',
      email: 's@test.local',
      isActive: true,
    });

    expect(summary.membersNeedingAttention).toBe(1);
    expect(summary.visitsCompleted).toBe(2);
    expect(summary.tasksOpen).toBe(1);
  });

  it('keeps self-logged visits after member reassignment', async () => {
    const supabase = {
      from(table: string) {
        if (table === 'members') {
          return {
            select: async () => ({
              data: [
                { id: 'm1', risk_level: 'low', status: 'active', assigned_to: 'user-2' },
              ],
            }),
          };
        }
        if (table === 'visits') {
          return {
            select: () => ({
              gte: async () => ({
                data: [
                  {
                    visit_type: 'visit',
                    visited_at: new Date().toISOString(),
                    logged_by: 'user-1',
                    member_id: 'm1',
                  },
                ],
              }),
            }),
          };
        }
        return {
          select: async () => ({
            data: [{ status: 'open', assignee_id: 'user-1' }],
          }),
        };
      },
    };

    const summary = await buildSummary(supabase as never, { RECENT_ACTIVITY_DAYS: '7' } as never, {
      userId: 'user-1',
      role: 'shepherd',
      email: 's@test.local',
      isActive: true,
    });

    expect(summary.membersNeedingAttention).toBe(0);
    expect(summary.visitsCompleted).toBe(1);
  });

  it('returns global summaries for admin and owner', async () => {
    const supabase = {
      from(table: string) {
        if (table === 'members') {
          return {
            select: async () => ({
              data: [
                { id: 'm1', risk_level: 'high', status: 'inactive', assigned_to: 'user-1' },
                { id: 'm2', risk_level: 'low', status: 'active', assigned_to: 'user-2' },
              ],
            }),
          };
        }
        if (table === 'visits') {
          return {
            select: () => ({
              gte: async () => ({
                data: [
                  { visit_type: 'call', visited_at: new Date().toISOString(), logged_by: 'user-1', member_id: 'm1' },
                  { visit_type: 'visit', visited_at: new Date().toISOString(), logged_by: 'user-2', member_id: 'm2' },
                ],
              }),
            }),
          };
        }
        return {
          select: async () => ({
            data: [
              { status: 'open', assignee_id: 'user-1' },
              { status: 'open', assignee_id: 'user-2' },
            ],
          }),
        };
      },
    };

    const summary = await buildSummary(supabase as never, { RECENT_ACTIVITY_DAYS: '7' } as never, {
      userId: 'admin-1',
      role: 'admin',
      email: 'a@test.local',
      isActive: true,
    });

    expect(summary.membersNeedingAttention).toBe(1);
    expect(summary.visitsCompleted).toBe(2);
    expect(summary.tasksOpen).toBe(2);
  });
});
