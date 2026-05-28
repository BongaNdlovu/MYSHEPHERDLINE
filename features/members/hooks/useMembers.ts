import { useCallback } from 'react';

import {
  fetchMemberById,
  fetchMembersNeedingAttention,
  fetchMembersPage,
  type MemberListQuery,
} from '@/features/members/services/members.service';
import { notFoundError } from '@/lib/core/errors';
import type { PaginatedQueryState, QueryState } from '@/lib/core/query-types';
import { usePaginatedQuery } from '@/lib/core/usePaginatedQuery';
import { useQuery } from '@/lib/core/useQuery';
import type { Member, MemberListRow } from '@/types/database';

export type UseMembersOptions = Omit<MemberListQuery, 'page'>;

function useAttentionMembersQuery(
  search: string | undefined,
  enabled: boolean,
): QueryState<MemberListRow[]> {
  const fetch = useCallback(
    () => fetchMembersNeedingAttention({ search }),
    [search],
  );

  return useQuery({
    deps: [search],
    enabled,
    errorMessage: 'Unable to load members needing attention.',
    initialData: [],
    fetch,
    dataLength: (members) => members.length,
  });
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
        careStage: options.careStage,
        assignedTo: options.assignedTo,
        notContacted: options.notContacted,
      }),
    [
      options.assignedTo,
      options.careStage,
      options.notContacted,
      options.pageSize,
      options.riskLevel,
      options.search,
      options.status,
    ],
  );

  const paginatedQuery = usePaginatedQuery({
    fetchPage,
    deps: [
      options.assignedTo,
      options.careStage,
      options.notContacted,
      options.pageSize,
      options.riskLevel,
      options.search,
      options.status,
    ],
    errorMessage: 'Unable to load members.',
    enabled: !attentionOnly,
  });

  const attentionQuery = useAttentionMembersQuery(options.search, attentionOnly);

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
  const fetch = useCallback(async () => {
    const member = await fetchMemberById(id!);
    if (!member) throw notFoundError('Member');
    return member;
  }, [id]);

  return useQuery({
    deps: [id],
    enabled: Boolean(id),
    errorMessage: 'Unable to load member.',
    initialData: null,
    fetch,
    dataLength: (member) => (member ? 1 : 0),
  });
}
