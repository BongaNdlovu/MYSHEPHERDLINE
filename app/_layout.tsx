import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';
import { ToastSnackbar } from '@/components/ToastSnackbar';
import { colors } from '@/constants/theme';
import { envValidation } from '@/lib/config/env';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  if (!envValidation.ok) {
    return <ConfigErrorScreen validation={envValidation} />;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="landing" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="member/[id]" />
            <Stack.Screen name="log-visit/[memberId]" />
            <Stack.Screen name="legal/privacy" />
            <Stack.Screen name="legal/terms" />
          </Stack>
          <ToastSnackbar />
        </View>
      </ToastProvider>
    </AuthProvider>
  );
}
