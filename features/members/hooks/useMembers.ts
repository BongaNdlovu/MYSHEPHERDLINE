import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchMemberById,
  fetchMembersPage,
  type MemberListQuery,
} from '@/features/members/services/members.service';
import type { AppError } from '@/lib/core/errors';
import { notFoundError, toAppError } from '@/lib/core/errors';
import { appendUniquePage } from '@/lib/core/paginated-state';
import { computeIsStale, type PaginatedQueryState, type QueryState } from '@/lib/core/query-types';
import type { Member, MemberListRow } from '@/types/database';

export type UseMembersOptions = Omit<MemberListQuery, 'page'>;

export function useMembers(options: UseMembersOptions = {}): PaginatedQueryState<MemberListRow> {
  const [data, setData] = useState<MemberListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(async (pageToLoad: number, append: boolean) => {
    const requestId = ++requestIdRef.current;

    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetchMembersPage({
        page: pageToLoad,
        pageSize: options.pageSize,
        search: options.search,
        status: options.status,
        riskLevel: options.riskLevel,
      });
      if (requestId !== requestIdRef.current) return;

      setData((current) => (append ? appendUniquePage(current, result.items) : result.items));
      setPage(result.page);
      setHasMore(result.hasMore);
      setLastLoadedAt(Date.now());
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(toAppError(err, 'Unable to load members.'));
      if (!append) setData([]);
      setHasMore(false);
    } finally {
      if (requestId !== requestIdRef.current) return;

      setLoading(false);
      setLoadingMore(false);
    }
  }, [options.pageSize, options.riskLevel, options.search, options.status]);

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
    const timer = setTimeout(() => {
      void loadPage(0, false);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPage, options.search, options.status, options.riskLevel, options.pageSize]);

  const isStale = useMemo(
    () => computeIsStale({ loading, loadingMore, error, lastLoadedAt, dataLength: data.length }),
    [data.length, error, lastLoadedAt, loading, loadingMore],
  );

  return {
    data,
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

export function useMember(id: string | undefined): QueryState<Member | null> {
  const [data, setData] = useState<Member | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const member = await fetchMemberById(id);
      if (!member) {
        setData(null);
        setError(notFoundError('Member'));
        return;
      }
      setData(member);
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load member.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const isStale = useMemo(
    () => computeIsStale({ loading, error, lastLoadedAt, dataLength: data ? 1 : 0 }),
    [data, error, lastLoadedAt, loading],
  );

  return { data, loading, error, refresh, lastLoadedAt, isStale };
}
