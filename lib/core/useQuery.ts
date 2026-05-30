import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AppError } from '@/lib/core/errors';
import { toAppError } from '@/lib/core/errors';
import { retainQueryDataOnError } from '@/lib/core/query-cache';
import { computeIsStale, type QueryState } from '@/lib/core/query-types';

type UseQueryOptions<T> = {
  deps: readonly unknown[];
  enabled?: boolean;
  errorMessage: string;
  initialData: T;
  fetch: () => Promise<T>;
  dataLength?: (data: T) => number;
};

export function useQuery<T>(options: UseQueryOptions<T>): QueryState<T> {
  const { deps, enabled = true, errorMessage, initialData, fetch, dataLength } = options;

  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const requestIdRef = useRef(0);
  const fetchRef = useRef(fetch);
  const initialDataRef = useRef(initialData);
  const dataLengthRef = useRef(dataLength);

  useEffect(() => {
    fetchRef.current = fetch;
    initialDataRef.current = initialData;
    dataLengthRef.current = dataLength;
  }, [dataLength, fetch, initialData]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(initialDataRef.current);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchRef.current();
      if (requestId !== requestIdRef.current) return;
      setData(next);
      setLastLoadedAt(Date.now());
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(toAppError(err, errorMessage));
      setData((current) =>
        retainQueryDataOnError(current, initialDataRef.current, dataLengthRef.current),
      );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [enabled, errorMessage]);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      return;
    }

    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps drive refetch when query inputs change
  }, [enabled, refresh, ...deps]);

  const displayedData = enabled ? data : initialData;
  const displayedLoading = enabled ? loading : false;
  const displayedError = enabled ? error : null;
  const length = dataLength
    ? dataLength(displayedData)
    : Array.isArray(displayedData)
      ? displayedData.length
      : displayedData
        ? 1
        : 0;

  const isStale = useMemo(
    () => computeIsStale({ loading: displayedLoading, error: displayedError, lastLoadedAt, dataLength: length }),
    [displayedError, displayedLoading, lastLoadedAt, length],
  );

  return { data: displayedData, loading: displayedLoading, error: displayedError, refresh, lastLoadedAt, isStale };
}
