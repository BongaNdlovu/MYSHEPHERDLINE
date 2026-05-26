import type { SupabaseClient } from '@supabase/supabase-js';

import { isValidExpoPushToken } from './auth';
import { buildSummary } from './reports';
import type { WorkerEnv } from './env';

type RegisterPayload = {
  expoPushToken?: unknown;
  deviceName?: unknown;
};

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

export async function registerToken(
  supabase: SupabaseClient,
  userId: string,
  payload: { expoPushToken: string; deviceName: string | null },
) {
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: payload.expoPushToken,
      device_name: payload.deviceName,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  );

  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function sendDigest(supabase: SupabaseClient, env: WorkerEnv) {
  const summary = await buildSummary(supabase, env, {
    userId: 'system',
    role: 'owner',
    email: '',
    isActive: true,
  });
  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('is_active', true);

  if (error) return { error: error.message };

  const messages = (tokens ?? []).map((token) => ({
    to: token.expo_push_token,
    sound: 'default',
    title: 'MyShepherdLine digest',
    body: `${summary.membersNeedingAttention} members need attention. ${summary.tasksOpen} open tasks.`,
  }));

  if (!messages.length) return { sent: 0 };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  return { sent: messages.length, result };
}
