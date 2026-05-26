import { Redirect, Stack, useSegments } from 'expo-router';

import { useAdminAccess } from '@/features/admin/hooks/useAdminAccess';

export default function AdminLayout() {
  const { loading, isAdmin } = useAdminAccess();
  const segments = useSegments();
  const onUnauthorized = segments.includes('unauthorized');

  if (!onUnauthorized && !loading && !isAdmin) {
    return <Redirect href="/admin/unauthorized" />;
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
