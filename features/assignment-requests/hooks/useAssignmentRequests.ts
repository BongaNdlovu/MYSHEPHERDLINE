import { useCallback } from 'react';

import {
  fetchPendingAssignmentRequests,
  type AssignmentRequestDetail,
} from '@/features/assignment-requests/services/assignment-requests.service';
import type { QueryState } from '@/lib/core/query-types';
import { useQuery } from '@/lib/core/useQuery';

export function usePendingAssignmentRequests(): QueryState<AssignmentRequestDetail[]> {
  const fetch = useCallback(() => fetchPendingAssignmentRequests(), []);

  return useQuery({
    deps: [],
    errorMessage: 'Unable to load assignment requests.',
    initialData: [],
    fetch,
    dataLength: (requests) => requests.length,
  });
}
