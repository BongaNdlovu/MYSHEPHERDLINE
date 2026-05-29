import { describe, expect, it } from 'vitest';

import {
  buildWeekDayStrip,
  formatTaskDueDate,
  groupTasksByDueDate,
  normalizeDueDateKey,
  toDateKey,
} from '@/features/tasks/selectors/tasks';
import { getInitials } from '@/lib/core/names';
import type { Task } from '@/types/database';

const orgId = 'a0000000-0000-4000-8000-000000000001';
const now = '2026-05-26T10:00:00.000Z';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    organization_id: orgId,
    title: 'Call member',
    description: null,
    assignee_id: 'user-1',
    member_id: '1',
    due_date: '2026-05-26',
    due_at: '2026-05-26T09:00:00.000Z',
    reminder_sent_at: null,
    reminder_minutes_before: 60,
    status: 'open',
    priority: 'high',
    task_type: 'call',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

const fixtureTasks: Task[] = [
  task(),
  task({
    id: 't2',
    title: 'Visit family',
    assignee_id: null,
    member_id: null,
    due_date: '2026-05-28',
    due_at: '2026-05-28T09:00:00.000Z',
    priority: 'medium',
    task_type: 'visit',
  }),
];

describe('tasks domain', () => {
  it('groups tasks by due date', () => {
    const grouped = groupTasksByDueDate(fixtureTasks, '2026-05-26');
    expect(grouped.today).toHaveLength(1);
    expect(grouped.upcoming).toHaveLength(1);
    expect(grouped.overdue).toHaveLength(0);
  });

  it('separates overdue tasks from upcoming tasks', () => {
    const grouped = groupTasksByDueDate(
      [
        { ...fixtureTasks[0], due_date: '2026-05-20' },
        { ...fixtureTasks[1], due_date: '2026-05-30' },
      ],
      '2026-05-26',
    );

    expect(grouped.overdue).toHaveLength(1);
    expect(grouped.upcoming).toHaveLength(1);
  });

  it('normalizes timestamp due dates to date keys', () => {
    expect(normalizeDueDateKey('2026-05-26T00:00:00.000Z')).toBe('2026-05-26');
    expect(formatTaskDueDate('2026-05-26T00:00:00.000Z')).toBeTruthy();
  });

  it('creates stable date keys', () => {
    expect(toDateKey(new Date(2026, 4, 26, 15, 0, 0))).toBe('2026-05-26');
  });

  it('builds Monday-based week strips even on Sundays', () => {
    const week = buildWeekDayStrip(new Date(2026, 4, 31, 12, 0, 0));

    expect(week[0]?.dateKey).toBe('2026-05-25');
    expect(week[6]?.dateKey).toBe('2026-05-31');
    expect(week[6]?.isToday).toBe(true);
  });
});

describe('name helpers', () => {
  it('ignores empty name parts when building initials', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD');
    expect(getInitials('  ')).toBe('');
  });

  it('handles nullish runtime input safely', () => {
    expect(getInitials(null)).toBe('');
    expect(getInitials(undefined)).toBe('');
  });
});
