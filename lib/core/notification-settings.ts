import {
  getPushRegistrationBlocker,
  registerForPushNotifications,
} from '@/lib/core/notifications';

export type NotificationStatus =
  | 'unsupported'
  | 'simulator'
  | 'development_build_required'
  | 'worker_unconfigured'
  | 'denied'
  | 'granted'
  | 'unknown';

export async function getNotificationStatus(): Promise<NotificationStatus> {
  const blocker = getPushRegistrationBlocker();
  if (blocker) return blocker;

  const Notifications = await import('expo-notifications');
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
    case 'development_build_required':
      return 'Push notifications require a development build or installed app. Expo Go cannot register remote push notifications.';
    case 'worker_unconfigured':
      return 'Worker API is not configured for push registration.';
    case 'denied':
      return 'Permission denied. Enable notifications in device settings.';
    case 'granted':
      return 'Notifications enabled. You will receive care reminders and daily care-list updates.';
    default:
      return 'Tap below to enable care reminder notifications.';
  }
}

export async function enableNotifications(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  const result = await registerForPushNotifications(accessToken);
  if (result.error) return { ok: false, error: result.error };
  return { ok: true };
}
