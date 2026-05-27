import { useCallback } from 'react';

import { fetchVisitsForMemberPage } from '@/features/visits/services/visits.service';
import type { PaginatedQueryState } from '@/lib/core/query-types';
import { usePaginatedQuery } from '@/lib/core/usePaginatedQuery';
import type { VisitListRow } from '@/features/visits/services/visits.service';

export function useMemberVisits(memberId: string | undefined): PaginatedQueryState<VisitListRow> {
  const fetchPage = useCallback(
    (page: number) => fetchVisitsForMemberPage(memberId!, { page }),
    [memberId],
  );

  return usePaginatedQuery({
    fetchPage,
    deps: [memberId],
    enabled: Boolean(memberId),
    errorMessage: 'Unable to load visit history.',
  });
}
