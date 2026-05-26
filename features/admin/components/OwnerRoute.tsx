import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { QueryStateView } from '@/components/ui/QueryStateView';
import { spacing } from '@/constants/theme';
import { useAdminAccess } from '@/features/admin/hooks/useAdminAccess';
import {
  canRenderOwnerRouteContent,
  shouldRedirectFromOwnerRoute,
} from '@/features/admin/selectors/route-guards';

export function OwnerRoute({ children }: { children: ReactNode }) {
  const { loading, isOwner } = useAdminAccess();
  const state = { loading, isOwner };

  if (loading) {
    return (
      <View style={styles.centered}>
        <QueryStateView loading error={null} />
      </View>
    );
  }

  if (shouldRedirectFromOwnerRoute(state)) {
    return <Redirect href="/admin/unauthorized" />;
  }

  if (!canRenderOwnerRouteContent(state)) {
    return null;
  }

  return children;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', padding: spacing.xl },
});
