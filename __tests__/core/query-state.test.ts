import { describe, expect, it } from 'vitest';

import { computeIsStale, hasStaleRefreshError, isInitialLoad, isRefreshing, queryDisplayError } from '@/lib/core/query-types';

describe('query display helpers', () => {
  const error = { category: 'network' as const, message: 'offline', retryable: true };

  it('detects initial load vs refresh', () => {
    expect(isInitialLoad(true, 0)).toBe(true);
    expect(isInitialLoad(true, 2)).toBe(false);
    expect(isRefreshing(true, 2)).toBe(true);
    expect(isRefreshing(false, 2)).toBe(false);
  });

  it('shows inline errors only without cached data', () => {
    expect(queryDisplayError(error, 0)).toEqual(error);
    expect(queryDisplayError(error, 2)).toBeNull();
    expect(hasStaleRefreshError(error, 2)).toBe(true);
    expect(hasStaleRefreshError(null, 2)).toBe(false);
  });
});

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
