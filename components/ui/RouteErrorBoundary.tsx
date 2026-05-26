import { type ErrorBoundaryProps } from 'expo-router';

import { FatalErrorScreen } from '@/components/ui/FatalErrorScreen';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <FatalErrorScreen error={error} title="Something went wrong" onRetry={retry} />;
}
