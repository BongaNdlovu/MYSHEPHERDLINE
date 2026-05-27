import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getAppEnv } from '@/lib/core/env';
import { registerForPushNotifications } from '@/lib/core/notifications';

export type NotificationStatus =
  | 'unsupported'
  | 'simulator'
  | 'worker_unconfigured'
  | 'denied'
  | 'granted'
  | 'unknown';

export async function getNotificationStatus(): Promise<NotificationStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  if (!Device.isDevice) return 'simulator';
  if (!getAppEnv().workerApiUrl) return 'worker_unconfigured';

  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'unknown';
}

export function notificationStatusLabel(status: NotificationStatus): string {
  switch (status) {
    case 'unsupported':
      return 'Notifications are not supported on web.';
    case 'simulator':
      return 'Use a physical device for push notifications.';
    case 'worker_unconfigured':
      return 'Worker API is not configured for push registration.';
    case 'denied':
      return 'Permission denied. Enable notifications in device settings.';
    case 'granted':
      return 'Notifications enabled. You will receive task reminders when due soon.';
    default:
      return 'Tap below to enable task reminder notifications.';
  }
}

export async function enableNotifications(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  const result = await registerForPushNotifications(accessToken);
  if (result.error) return { ok: false, error: result.error };
  return { ok: true };
}
