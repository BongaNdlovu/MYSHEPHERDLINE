import { describe, expect, it } from 'vitest';

import { groupTasksByDueDate, toDateKey } from '@/features/tasks/selectors/tasks';
import { fixtureTasks } from '@/__tests__/fixtures/demo-data';

describe('tasks domain', () => {
  it('groups tasks by due date', () => {
    const grouped = groupTasksByDueDate(fixtureTasks, '2026-05-26');
    expect(grouped.today).toHaveLength(1);
    expect(grouped.upcoming).toHaveLength(1);
  });

  it('creates stable date keys', () => {
    expect(toDateKey(new Date('2026-05-26T15:00:00.000Z'))).toBe('2026-05-26');
  });
});
