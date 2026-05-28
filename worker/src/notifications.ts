import type { SupabaseClient } from '@supabase/supabase-js';

import { isValidExpoPushToken } from './auth';

type RegisterPayload = {
  expoPushToken?: unknown;
  deviceName?: unknown;
};

export type RegisterTokenResult =
  | { ok: true }
  | { error: string; status: 403 | 409 | 500 };

export function parseRegisterPayload(body: unknown): { expoPushToken: string; deviceName: string | null } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid JSON body' };
  const payload = body as RegisterPayload;
  if (typeof payload.expoPushToken !== 'string' || !payload.expoPushToken.trim()) {
    return { error: 'expoPushToken is required' };
  }
  if (!isValidExpoPushToken(payload.expoPushToken.trim())) {
    return { error: 'expoPushToken format is invalid' };
  }
  const deviceName =
    typeof payload.deviceName === 'string' && payload.deviceName.trim()
      ? payload.deviceName.trim().slice(0, 120)
      : null;
  return { expoPushToken: payload.expoPushToken.trim(), deviceName };
}

function mapRegisterError(message: string): RegisterTokenResult {
  const normalized = message.toLowerCase();
  if (normalized.includes('duplicate') || normalized.includes('unique') || normalized.includes('23505')) {
    return { error: 'Push token already registered', status: 409 };
  }
  if (normalized.includes('permission') || normalized.includes('policy') || normalized.includes('42501')) {
    return { error: 'Not allowed to register push token', status: 403 };
  }
  return { error: message, status: 500 };
}

export async function registerToken(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
  payload: { expoPushToken: string; deviceName: string | null },
): Promise<RegisterTokenResult> {
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      organization_id: organizationId,
      expo_push_token: payload.expoPushToken,
      device_name: payload.deviceName,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  );

  if (error) return mapRegisterError(error.message);
  return { ok: true };
}

export {
  listDigestOrganizationIds,
  sendDigest,
  sendDigestForOrganization,
  type DigestOrgResult,
  type DigestSendResult,
} from './digest';
export {
  fetchPushTokensForUser,
  listTasksDueForReminder,
  sendTaskReminderPushes,
  sendTaskReminders,
  type TaskReminderRow,
  type TaskReminderSendResult,
} from './reminders';
export { sendExpoPushBatch, type PushDeliveryResult } from './push-delivery';
