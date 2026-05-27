import { useCallback } from 'react';

import {
  getNotificationStatus,
  type NotificationStatus,
} from '@/lib/core/notification-settings';
import type { QueryState } from '@/lib/core/query-types';
import { useQuery } from '@/lib/core/useQuery';

export function useNotificationStatus(): QueryState<NotificationStatus> {
  const fetch = useCallback(() => getNotificationStatus(), []);

  return useQuery({
    deps: [],
    errorMessage: 'Unable to check notification status.',
    initialData: 'unknown' as NotificationStatus,
    fetch,
    dataLength: () => 1,
  });
}
