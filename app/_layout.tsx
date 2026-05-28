import * as Sentry from '@sentry/react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfigErrorScreen } from '@/components/ui/ConfigErrorScreen';
import { ToastSnackbar } from '@/components/ui/ToastSnackbar';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/core/auth';
import { envValidation } from '@/lib/core/env';
import { initMonitoring } from '@/lib/core/monitoring';
import { ToastProvider } from '@/lib/core/toast';

export { ErrorBoundary } from '@/components/ui/RouteErrorBoundary';

initMonitoring();

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const ready = loaded || Boolean(error);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) return null;

  if (!envValidation.ok) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ConfigErrorScreen validation={envValidation} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <ToastProvider>
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="landing" />
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="access-request" />
              <Stack.Screen name="sign-up" />
              <Stack.Screen name="settings/profile" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="member/[id]" />
              <Stack.Screen name="member/[id]/care-progress" />
              <Stack.Screen name="member/[id]/assignment-request" />
              <Stack.Screen name="members/new" />
              <Stack.Screen name="log-visit/[memberId]" />
              <Stack.Screen name="legal/privacy" />
              <Stack.Screen name="legal/terms" />
              <Stack.Screen name="admin" />
            </Stack>
            <ToastSnackbar />
          </View>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
