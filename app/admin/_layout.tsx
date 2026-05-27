import { Redirect, Stack, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { QueryStateView } from '@/components/ui/QueryStateView';
import { spacing } from '@/constants/theme';
import { useAdminAccess } from '@/features/admin/hooks/useAdminAccess';
import {
  canRenderAdminLayout,
  shouldRedirectFromAdminLayout,
} from '@/features/admin/selectors/route-guards';

export { ErrorBoundary } from '@/components/ui/RouteErrorBoundary';

export default function AdminLayout() {
  const { loading, isAdmin } = useAdminAccess();
  const segments = useSegments();
  const onUnauthorizedScreen = segments.includes('unauthorized');
  const state = { loading, isAdmin, onUnauthorizedScreen };

  if (loading && !onUnauthorizedScreen) {
    return (
      <View style={styles.centered}>
        <QueryStateView loading error={null} />
      </View>
    );
  }

  if (shouldRedirectFromAdminLayout(state)) {
    return <Redirect href="/admin/unauthorized" />;
  }

  if (!canRenderAdminLayout(state)) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="unauthorized" />
      <Stack.Screen name="users" />
      <Stack.Screen name="members/index" />
      <Stack.Screen name="members/new" />
      <Stack.Screen name="members/[id]" />
      <Stack.Screen name="tasks/index" />
      <Stack.Screen name="tasks/new" />
      <Stack.Screen name="tasks/[id]" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="controls" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', padding: spacing.xl },
});
