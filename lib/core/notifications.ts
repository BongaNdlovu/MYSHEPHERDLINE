import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken } from '@/lib/core/api';
import { getAppEnv } from '@/lib/core/env';
import { createAppError } from '@/lib/core/errors';
import type { AppError } from '@/lib/core/errors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushRegistrationResult =
  | { token: string; error: null }
  | { token: null; error: string };

export async function registerForPushNotifications(
  accessToken: string,
): Promise<PushRegistrationResult> {
  try {
    if (!getAppEnv().workerApiUrl) {
      return { token: null, error: 'Worker API URL is not configured.' };
    }
    if (Platform.OS === 'web') {
      return { token: null, error: 'Push notifications are only supported on Android and iOS.' };
    }
    if (!Device.isDevice) {
      return { token: null, error: 'Push notifications require a physical device.' };
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { token: null, error: 'Notification permission was not granted.' };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
    if (!projectId) {
      return { token: null, error: 'Expo project ID is not configured.' };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const result = await registerPushToken(accessToken, token, Device.modelName ?? 'unknown');
    if (result.error) {
      return { token: null, error: result.error.message };
    }
    return { token, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Push registration failed.';
    return { token: null, error: message };
  }
}

/** @internal Maps registration failures to AppError for callers that need typed errors. */
export function pushRegistrationToAppError(result: PushRegistrationResult): AppError | null {
  if (!result.error) return null;
  return createAppError('config', result.error);
}
