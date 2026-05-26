import type { SupabaseClient } from '@supabase/supabase-js';

import { isValidExpoPushToken } from './auth';
import { buildSummary, type ReportSummary } from './reports';
import type { WorkerEnv } from './env';

type RegisterPayload = {
  expoPushToken?: unknown;
  deviceName?: unknown;
};

export type DigestSendResult =
  | { sent: number; organizations: number; results: DigestOrgResult[] }
  | { error: string };

export type DigestOrgResult = {
  organizationId: string;
  tokenCount: number;
  summary: ReportSummary;
  pushResult?: unknown;
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
  organizationId: string,
  payload: { expoPushToken: string; deviceName: string | null },
) {
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

  if (error) return { error: error.message };
  return { ok: true as const };
}

function digestBody(summary: ReportSummary) {
  return `${summary.membersNeedingAttention} members need attention. ${summary.tasksOpen} open tasks.`;
}

export async function sendDigestForOrganization(
  supabase: SupabaseClient,
  env: WorkerEnv,
  organizationId: string,
  expoPushTokens: string[],
): Promise<DigestOrgResult> {
  const summary = await buildSummary(supabase, env, {
    userId: 'system',
    organizationId,
    role: 'owner',
    email: '',
    isActive: true,
  });

  const result: DigestOrgResult = {
    organizationId,
    tokenCount: expoPushTokens.length,
    summary,
  };

  if (!expoPushTokens.length) return result;

  const messages = expoPushTokens.map((token) => ({
    to: token,
    sound: 'default',
    title: 'MyShepherdLine digest',
    body: digestBody(summary),
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  result.pushResult = await response.json();
  return result;
}

export async function listDigestOrganizationIds(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('organization_id')
    .eq('is_active', true);

  if (error) return { organizationIds: [] as string[], error: error.message };

  const organizationIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.organization_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  return { organizationIds };
}

export async function sendDigest(supabase: SupabaseClient, env: WorkerEnv): Promise<DigestSendResult> {
  const { organizationIds, error } = await listDigestOrganizationIds(supabase);
  if (error) return { error };
  if (!organizationIds.length) return { sent: 0, organizations: 0, results: [] };

  const { data: tokens, error: tokenError } = await supabase
    .from('push_tokens')
    .select('organization_id, expo_push_token')
    .eq('is_active', true);

  if (tokenError) return { error: tokenError.message };

  const tokensByOrg = new Map<string, string[]>();
  for (const row of tokens ?? []) {
    const orgId = row.organization_id as string | null;
    const pushToken = row.expo_push_token as string | null;
    if (!orgId || !pushToken) continue;
    const bucket = tokensByOrg.get(orgId) ?? [];
    bucket.push(pushToken);
    tokensByOrg.set(orgId, bucket);
  }

  const results: DigestOrgResult[] = [];
  let sent = 0;

  for (const organizationId of organizationIds) {
    const orgTokens = tokensByOrg.get(organizationId) ?? [];
    const orgResult = await sendDigestForOrganization(supabase, env, organizationId, orgTokens);
    results.push(orgResult);
    sent += orgResult.tokenCount;
  }

  return { sent, organizations: organizationIds.length, results };
}
