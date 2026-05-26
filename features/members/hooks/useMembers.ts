import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchMemberById,
  fetchMembersPage,
  type MemberListQuery,
} from '@/features/members/services/members.service';
import type { AppError } from '@/lib/core/errors';
import { notFoundError, toAppError } from '@/lib/core/errors';
import type { PaginatedQueryState, QueryState } from '@/lib/core/query-types';
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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const loadPage = useCallback(async (pageToLoad: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetchMembersPage({ ...optionsRef.current, page: pageToLoad });
      setData((current) => (append ? [...current, ...result.items] : result.items));
      setPage(result.page);
      setHasMore(result.hasMore);
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load members.'));
      if (!append) setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadPage(0, false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    await loadPage(page + 1, true);
  }, [hasMore, loadPage, loading, loadingMore, page]);

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage, options.search, options.status, options.riskLevel, options.pageSize]);

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
    isStale: false,
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
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh, lastLoadedAt, isStale: false };
}
