import { describe, expect, it } from 'vitest';

import {
  formatTaskDueDate,
  groupTasksByDueDate,
  normalizeDueDateKey,
  toDateKey,
} from '@/features/tasks/selectors/tasks';
import { getInitials } from '@/lib/core/names';
import { fixtureTasks } from '@/__tests__/fixtures/demo-data';

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
    expect(toDateKey(new Date('2026-05-26T15:00:00.000Z'))).toBe('2026-05-26');
  });
});

describe('name helpers', () => {
  it('ignores empty name parts when building initials', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD');
    expect(getInitials('  ')).toBe('');
  });
});
