import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import type { AppError } from '@/lib/core/errors';
import { toAppError } from '@/lib/core/errors';
import type { PaginatedResult } from '@/lib/core/pagination';
import { appendUniquePage } from '@/lib/core/paginated-state';
import { computeIsStale, type PaginatedQueryState } from '@/lib/core/query-types';

type ItemWithId = {
  id: string;
};

type UsePaginatedQueryOptions<T extends ItemWithId> = {
  fetchPage: (page: number) => Promise<PaginatedResult<T>>;
  deps: readonly unknown[];
  errorMessage: string;
  enabled?: boolean;
};

export type PaginatedQueryControls<T extends ItemWithId> = PaginatedQueryState<T> & {
  setData: Dispatch<SetStateAction<T[]>>;
};

export function usePaginatedQuery<T extends ItemWithId>(
  options: UsePaginatedQueryOptions<T>,
): PaginatedQueryControls<T> {
  const { fetchPage, deps, errorMessage, enabled = true } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      const requestId = ++requestIdRef.current;

      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await fetchPage(pageToLoad);
        if (requestId !== requestIdRef.current) return;

        setData((current) => (append ? appendUniquePage(current, result.items) : result.items));
        setPage(result.page);
        setHasMore(result.hasMore);
        setLastLoadedAt(Date.now());
      } catch (err) {
        if (requestId !== requestIdRef.current) return;

        setError(toAppError(err, errorMessage));
        if (!append) setData([]);
        setHasMore(false);
      } finally {
        if (requestId !== requestIdRef.current) return;

        setLoading(false);
        setLoadingMore(false);
      }
    },
    [errorMessage, fetchPage],
  );

  const refresh = useCallback(async () => {
    await loadPage(0, false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      await loadPage(page + 1, true);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [hasMore, loadPage, loading, loadingMore, page]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      void loadPage(0, false);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps drive refetch when query inputs change
  }, [enabled, loadPage, ...deps]);

  const isStale = useMemo(
    () => computeIsStale({ loading, loadingMore, error, lastLoadedAt, dataLength: data.length }),
    [data.length, error, lastLoadedAt, loading, loadingMore],
  );

  return {
    data,
    setData,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    page,
    hasMore,
    lastLoadedAt,
    isStale,
  };
}
