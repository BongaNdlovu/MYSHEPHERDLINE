import { describe, expect, it } from 'vitest';

import { appendUniquePage } from '@/lib/core/paginated-state';

describe('appendUniquePage', () => {
  it('appends new rows and updates existing rows without duplication', () => {
    const result = appendUniquePage(
      [
        { id: '1', name: 'Alpha' },
        { id: '2', name: 'Bravo' },
      ],
      [
        { id: '2', name: 'Bravo Updated' },
        { id: '3', name: 'Charlie' },
      ],
    );

    expect(result).toEqual([
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Bravo Updated' },
      { id: '3', name: 'Charlie' },
    ]);
  });
});
