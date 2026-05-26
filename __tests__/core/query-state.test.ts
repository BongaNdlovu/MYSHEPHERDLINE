import { describe, expect, it } from 'vitest';

import { computeIsStale } from '@/lib/core/query-types';

describe('computeIsStale', () => {
  it('is false before any successful load', () => {
    expect(
      computeIsStale({
        loading: true,
        loadingMore: false,
        error: null,
        lastLoadedAt: null,
        dataLength: 0,
      }),
    ).toBe(false);
  });

  it('is true while refreshing cached list data', () => {
    expect(
      computeIsStale({
        loading: true,
        loadingMore: false,
        error: null,
        lastLoadedAt: Date.now(),
        dataLength: 3,
      }),
    ).toBe(true);
  });

  it('is false while paginating additional pages', () => {
    expect(
      computeIsStale({
        loading: false,
        loadingMore: true,
        error: null,
        lastLoadedAt: Date.now(),
        dataLength: 3,
      }),
    ).toBe(false);
  });

  it('is true when refresh failed but cached data remains visible', () => {
    expect(
      computeIsStale({
        loading: false,
        loadingMore: false,
        error: { category: 'network', message: 'offline', retryable: true },
        lastLoadedAt: Date.now(),
        dataLength: 2,
      }),
    ).toBe(true);
  });
});
