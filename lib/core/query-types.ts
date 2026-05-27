import type { AppError } from '@/lib/core/errors';

export type QueryState<T> = {
  data: T;
  loading: boolean;
  error: AppError | null;
  refresh: () => Promise<void>;
  lastLoadedAt: number | null;
  isStale: boolean;
};

export type PaginatedQueryState<T> = QueryState<T[]> & {
  page: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
};

/** True on first load before any rows/items are available. */
export function isInitialLoad(loading: boolean, dataLength: number): boolean {
  return loading && dataLength === 0;
}

/** True when refreshing with cached rows/items still visible. */
export function isRefreshing(loading: boolean, dataLength: number): boolean {
  return loading && dataLength > 0;
}

/** Inline query errors only when there is no cached data to show. */
export function queryDisplayError(error: AppError | null, dataLength: number): AppError | null {
  return error && dataLength === 0 ? error : null;
}

/** True when refresh failed but cached data remains visible. */
export function hasStaleRefreshError(error: AppError | null, dataLength: number): boolean {
  return Boolean(error && dataLength > 0);
}

/** True when cached list data is visible during refresh or after a failed refresh. */
export function computeIsStale(input: {
  loading: boolean;
  loadingMore?: boolean;
  error: AppError | null;
  lastLoadedAt: number | null;
  dataLength: number;
}): boolean {
  if (!input.lastLoadedAt || input.dataLength === 0) return false;
  if (input.loading && !input.loadingMore) return true;
  if (input.error) return true;
  return false;
}
