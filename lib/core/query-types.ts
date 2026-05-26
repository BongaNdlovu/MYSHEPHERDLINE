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
