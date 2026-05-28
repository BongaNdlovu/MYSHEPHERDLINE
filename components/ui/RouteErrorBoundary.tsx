import { type ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';

import { FatalErrorScreen } from '@/components/ui/FatalErrorScreen';
import { reportClientError } from '@/lib/core/monitoring';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportClientError(error, { source: 'route_error_boundary' });
  }, [error]);

  return <FatalErrorScreen error={error} title="Something went wrong" onRetry={retry} />;
}
