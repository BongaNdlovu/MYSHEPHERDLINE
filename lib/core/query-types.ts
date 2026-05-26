import type { AppError } from '@/lib/core/errors';

export type QueryState<T> = {
  data: T;
  loading: boolean;
  error: AppError | null;
  refresh: () => Promise<void>;
  lastLoadedAt: number | null;
  isStale: boolean;
};
