import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/core/auth';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Redirect href="/(tabs)" />;
  return <Redirect href="/landing" />;
}
