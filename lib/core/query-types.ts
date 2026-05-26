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
