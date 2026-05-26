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
                { risk_level: 'high', status: 'inactive', assigned_to: 'user-1' },
                { risk_level: 'low', status: 'active', assigned_to: 'user-2' },
              ],
            }),
          };
        }
        if (table === 'visits') {
          return {
            select: () => ({
              gte: async () => ({
                data: [
                  { visit_type: 'call', visited_at: new Date().toISOString(), logged_by: 'user-1' },
                  { visit_type: 'visit', visited_at: new Date().toISOString(), logged_by: 'user-2' },
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
      userId: 'user-1',
      role: 'shepherd',
    });

    expect(summary.membersNeedingAttention).toBe(1);
    expect(summary.visitsCompleted).toBe(1);
    expect(summary.tasksOpen).toBe(1);
  });
});
