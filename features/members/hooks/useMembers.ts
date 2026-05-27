import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchMemberById,
  fetchMembersNeedingAttention,
  fetchMembersPage,
  type MemberListQuery,
} from '@/features/members/services/members.service';
import type { AppError } from '@/lib/core/errors';
import { notFoundError, toAppError } from '@/lib/core/errors';
import { computeIsStale, type PaginatedQueryState, type QueryState } from '@/lib/core/query-types';
import { usePaginatedQuery } from '@/lib/core/usePaginatedQuery';
import type { Member, MemberListRow } from '@/types/database';

export type UseMembersOptions = Omit<MemberListQuery, 'page'>;

function useAttentionMembersQuery(enabled: boolean): QueryState<MemberListRow[]> {
  const [data, setData] = useState<MemberListRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    try {
      const members = await fetchMembersNeedingAttention();
      setData(members);
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load members needing attention.'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [enabled, refresh]);

  const isStale = useMemo(
    () => computeIsStale({ loading, error, lastLoadedAt, dataLength: data.length }),
    [data.length, error, lastLoadedAt, loading],
  );

  return { data, loading, error, refresh, lastLoadedAt, isStale };
}

export function useMembers(options: UseMembersOptions = {}): PaginatedQueryState<MemberListRow> {
  const attentionOnly = options.attentionOnly === true;

  const fetchPage = useCallback(
    (page: number) =>
      fetchMembersPage({
        page,
        pageSize: options.pageSize,
        search: options.search,
        status: options.status,
        riskLevel: options.riskLevel,
        attentionOnly: options.attentionOnly,
      }),
    [options.attentionOnly, options.pageSize, options.riskLevel, options.search, options.status],
  );

  const paginatedQuery = usePaginatedQuery({
    fetchPage,
    deps: [options.pageSize, options.riskLevel, options.search, options.status, options.attentionOnly],
    errorMessage: 'Unable to load members.',
    enabled: !attentionOnly,
  });

  const attentionQuery = useAttentionMembersQuery(attentionOnly);

  if (attentionOnly) {
    return {
      data: attentionQuery.data,
      loading: attentionQuery.loading,
      loadingMore: false,
      error: attentionQuery.error,
      refresh: attentionQuery.refresh,
      loadMore: async () => {},
      page: 0,
      hasMore: false,
      lastLoadedAt: attentionQuery.lastLoadedAt,
      isStale: attentionQuery.isStale,
    };
  }

  return paginatedQuery;
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
