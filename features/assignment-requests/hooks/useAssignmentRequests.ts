import { useCallback } from 'react';

import { fetchPendingAssignmentRequests } from '@/features/assignment-requests/services/assignment-requests.service';
import type { QueryState } from '@/lib/core/query-types';
import { useQuery } from '@/lib/core/useQuery';
import type { AssignmentRequest } from '@/types/database';

export function usePendingAssignmentRequests(): QueryState<AssignmentRequest[]> {
  const fetch = useCallback(() => fetchPendingAssignmentRequests(), []);

  return useQuery({
    deps: [],
    errorMessage: 'Unable to load assignment requests.',
    initialData: [],
    fetch,
    dataLength: (requests) => requests.length,
  });
}
