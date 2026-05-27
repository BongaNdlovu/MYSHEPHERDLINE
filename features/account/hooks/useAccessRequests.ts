import { useCallback } from 'react';

import {
  fetchPendingAccessRequests,
  type AccessRequestDetail,
} from '@/features/account/services/profile-preferences.service';
import type { QueryState } from '@/lib/core/query-types';
import { useQuery } from '@/lib/core/useQuery';

export function usePendingAccessRequests(): QueryState<AccessRequestDetail[]> {
  const fetch = useCallback(() => fetchPendingAccessRequests(), []);

  return useQuery({
    deps: [],
    errorMessage: 'Unable to load access requests.',
    initialData: [],
    fetch,
    dataLength: (requests) => requests.length,
  });
}
