import { router } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

/** Intercepts Android hardware back to pop the stack instead of exiting the app. */
export function useAndroidBackNavigation(onBack?: () => void) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [onBack]);
}
