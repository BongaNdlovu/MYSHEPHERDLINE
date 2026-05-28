import { describe, expect, it } from 'vitest';

import { retainPaginatedDataOnError, retainQueryDataOnError } from '@/lib/core/query-cache';

describe('retainQueryDataOnError', () => {
  it('keeps cached rows when refresh fails', () => {
    expect(retainQueryDataOnError(['a', 'b'], [])).toEqual(['a', 'b']);
  });

  it('resets to initial data when nothing was cached', () => {
    expect(retainQueryDataOnError([], [])).toEqual([]);
    expect(retainQueryDataOnError(null, null)).toBeNull();
  });

  it('respects custom dataLength', () => {
    expect(retainQueryDataOnError({ items: [1] }, { items: [] }, (data) => data.items.length)).toEqual({
      items: [1],
    });
  });
});

describe('retainPaginatedDataOnError', () => {
  it('keeps cached pages when refresh fails', () => {
    expect(retainPaginatedDataOnError([{ id: '1' }])).toEqual([{ id: '1' }]);
  });

  it('clears when the first load fails', () => {
    expect(retainPaginatedDataOnError([])).toEqual([]);
  });
});
