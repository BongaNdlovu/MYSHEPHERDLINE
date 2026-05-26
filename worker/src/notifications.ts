import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthContext } from './auth';
import { isValidExpoPushToken } from './auth';
import { buildSummary, type ReportSummary } from './reports';
import type { WorkerEnv } from './env';

type RegisterPayload = {
  expoPushToken?: unknown;
  deviceName?: unknown;
};

export type PushDeliveryResult = {
  requested: number;
  sent: number;
  failed: number;
  batches: number;
  error?: string;
};

export type DigestSendResult =
  | { sent: number; organizations: number; results: DigestOrgResult[] }
  | { error: string };

export type DigestOrgResult = {
  organizationId: string;
  tokenCount: number;
  summary?: ReportSummary;
  summaryError?: string;
  pushDelivery?: PushDeliveryResult;
  pushError?: string;
};

export type RegisterTokenResult =
  | { ok: true }
  | { error: string; status: 403 | 409 | 500 };

const EXPO_PUSH_CHUNK_SIZE = 100;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

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

function digestBody(summary: ReportSummary) {
  return `${summary.membersNeedingAttention} members need attention. ${summary.tasksOpen} open tasks.`;
}

function chunkTokens(tokens: string[], chunkSize = EXPO_PUSH_CHUNK_SIZE) {
  const chunks: string[][] = [];
  for (let index = 0; index < tokens.length; index += chunkSize) {
    chunks.push(tokens.slice(index, index + chunkSize));
  }
  return chunks;
}

type ExpoTicket = { status?: string };

function countSuccessfulTickets(payload: unknown, requested: number) {
  if (!payload || typeof payload !== 'object') {
    return { sent: 0, failed: requested };
  }

  const data = (payload as { data?: ExpoTicket[] }).data;
  if (!Array.isArray(data)) {
    return { sent: 0, failed: requested };
  }

  const sent = data.filter((ticket) => ticket.status === 'ok').length;
  return { sent, failed: Math.max(requested - sent, 0) };
}

export async function sendExpoPushBatch(
  expoPushTokens: string[],
  summary: ReportSummary,
): Promise<PushDeliveryResult> {
  if (!expoPushTokens.length) {
    return { requested: 0, sent: 0, failed: 0, batches: 0 };
  }

  const chunks = chunkTokens(expoPushTokens);
  let requested = 0;
  let sent = 0;
  let failed = 0;
  let batches = 0;

  for (const chunk of chunks) {
    requested += chunk.length;
    const messages = chunk.map((token) => ({
      to: token,
      sound: 'default',
      title: 'MyShepherdLine digest',
      body: digestBody(summary),
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        failed += chunk.length;
        return {
          requested,
          sent,
          failed,
          batches,
          error: `Expo push API returned ${response.status}`,
        };
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        failed += chunk.length;
        return {
          requested,
          sent,
          failed,
          batches,
          error: 'Expo push API returned invalid JSON',
        };
      }

      const counts = countSuccessfulTickets(payload, chunk.length);
      sent += counts.sent;
      failed += counts.failed;
      batches += 1;
    } catch {
      failed += chunk.length;
      return {
        requested,
        sent,
        failed,
        batches,
        error: 'Expo push network failure',
      };
    }
  }

  return { requested, sent, failed, batches };
}

async function resolveDigestReportContext(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<AuthContext | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, is_active')
    .eq('organization_id', organizationId)
    .eq('role', 'owner')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;

  return {
    userId: data.id as string,
    organizationId,
    role: 'owner',
    email: (data.email as string | null) ?? '',
    isActive: true,
  };
}

export async function sendDigestForOrganization(
  supabase: SupabaseClient,
  env: WorkerEnv,
  organizationId: string,
  expoPushTokens: string[],
): Promise<DigestOrgResult> {
  const result: DigestOrgResult = {
    organizationId,
    tokenCount: expoPushTokens.length,
  };

  const context = await resolveDigestReportContext(supabase, organizationId);
  if (!context) {
    result.summaryError = 'No active owner found for organization';
    return result;
  }

  try {
    result.summary = await buildSummary(supabase, env, context);
  } catch (error) {
    result.summaryError = error instanceof Error ? error.message : 'Summary build failed';
    return result;
  }

  if (!expoPushTokens.length) return result;

  const delivery = await sendExpoPushBatch(expoPushTokens, result.summary);
  result.pushDelivery = delivery;
  if (delivery.error) {
    result.pushError = delivery.error;
  }

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
    try {
      const orgResult = await sendDigestForOrganization(supabase, env, organizationId, orgTokens);
      results.push(orgResult);
      sent += orgResult.pushDelivery?.sent ?? 0;
    } catch (error) {
      results.push({
        organizationId,
        tokenCount: orgTokens.length,
        summaryError: error instanceof Error ? error.message : 'Digest failed',
      });
    }
  }

  return { sent, organizations: organizationIds.length, results };
}
