import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isExpoGoRuntime } from '@/lib/core/expo-runtime';
import { registerPushToken } from '@/lib/core/api';
import { getAppEnv } from '@/lib/core/env';
import { createAppError } from '@/lib/core/errors';
import type { AppError } from '@/lib/core/errors';

type NotificationsModule = typeof import('expo-notifications');

type PushRegistrationBlocker =
  | 'unsupported'
  | 'simulator'
  | 'development_build_required'
  | 'worker_unconfigured';

let notificationsModule: NotificationsModule | null = null;
let notificationHandlerConfigured = false;

async function getNotificationsModule(): Promise<NotificationsModule> {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }

  if (!notificationHandlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return notificationsModule;
}

export function getPushRegistrationBlocker(): PushRegistrationBlocker | null {
  if (Platform.OS === 'web') return 'unsupported';
  if (!Device.isDevice) return 'simulator';
  if (isExpoGoRuntime()) return 'development_build_required';
  if (!getAppEnv().workerApiUrl) return 'worker_unconfigured';
  return null;
}

export function pushRegistrationBlockerMessage(blocker: PushRegistrationBlocker): string {
  switch (blocker) {
    case 'unsupported':
      return 'Push notifications are only supported on Android and iOS.';
    case 'simulator':
      return 'Push notifications require a physical device.';
    case 'development_build_required':
      return 'Push notifications require a development build or production app. Expo Go does not support remote push notifications.';
    case 'worker_unconfigured':
      return 'Worker API URL is not configured.';
    default:
      return 'Push registration failed.';
  }
}

export type PushRegistrationResult =
  | { token: string; error: null }
  | { token: null; error: string };

export async function registerForPushNotifications(
  accessToken: string,
): Promise<PushRegistrationResult> {
  try {
    const blocker = getPushRegistrationBlocker();
    if (blocker) {
      return { token: null, error: pushRegistrationBlockerMessage(blocker) };
    }

    const Notifications = await getNotificationsModule();
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
