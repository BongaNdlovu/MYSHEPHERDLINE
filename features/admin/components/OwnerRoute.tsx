import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useAdminAccess } from '@/features/admin/hooks/useAdminAccess';

export function OwnerRoute({ children }: { children: ReactNode }) {
  const { loading, isOwner } = useAdminAccess();

  if (!loading && !isOwner) {
    return <Redirect href="/admin/unauthorized" />;
  }

  return children;
}
