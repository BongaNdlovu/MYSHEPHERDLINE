import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthContext } from './auth';
import { isValidExpoPushToken } from './auth';
import { buildSummary, type ReportSummary } from './reports';
import type { WorkerEnv } from './env';
import { logAudit } from './logger';

type RegisterPayload = {
  expoPushToken?: unknown;
  deviceName?: unknown;
};

export type PushDeliveryResult = {
  requested: number;
  sent: number;
  failed: number;
  batches: number;
  deactivated: number;
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

const DEAD_TOKEN_ERRORS = new Set(['DeviceNotRegistered', 'InvalidCredentials', 'MismatchSenderId']);

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

type ExpoTicket = {
  status?: string;
  message?: string;
  details?: { error?: string };
};

type TicketCounts = {
  sent: number;
  failed: number;
  deadTokens: string[];
};

function parseTicketCounts(chunk: string[], payload: unknown): TicketCounts {
  if (!payload || typeof payload !== 'object') {
    return { sent: 0, failed: chunk.length, deadTokens: [] };
  }

  const data = (payload as { data?: ExpoTicket[] }).data;
  if (!Array.isArray(data) || data.length !== chunk.length) {
    return { sent: 0, failed: chunk.length, deadTokens: [] };
  }

  let sent = 0;
  let failed = 0;
  const deadTokens: string[] = [];

  data.forEach((ticket, index) => {
    if (ticket.status === 'ok') {
      sent += 1;
      return;
    }

    failed += 1;
    const ticketError = ticket.details?.error ?? ticket.message ?? 'unknown';
    if (DEAD_TOKEN_ERRORS.has(ticketError)) {
      deadTokens.push(chunk[index]);
    }
  });

  return { sent, failed, deadTokens };
}

async function deactivatePushTokens(supabase: SupabaseClient | undefined, tokens: string[]) {
  if (!supabase || !tokens.length) return 0;

  const { error } = await supabase
    .from('push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in('expo_push_token', tokens);

  if (error) {
    logAudit(
      { requestId: 'push-delivery', method: 'POST', path: '/notifications/digest' },
      'push_token_deactivate_failed',
      { count: tokens.length, message: error.message },
    );
    return 0;
  }

  return tokens.length;
}

export async function sendExpoPushBatch(
  expoPushTokens: string[],
  summary: ReportSummary,
  options?: { supabase?: SupabaseClient },
): Promise<PushDeliveryResult> {
  if (!expoPushTokens.length) {
    return { requested: 0, sent: 0, failed: 0, batches: 0, deactivated: 0 };
  }

  const chunks = chunkTokens(expoPushTokens);
  let requested = 0;
  let sent = 0;
  let failed = 0;
  let batches = 0;
  let deactivated = 0;
  let lastError: string | undefined;
  const deadTokens: string[] = [];

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
        lastError = `Expo push API returned ${response.status}`;
        continue;
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        failed += chunk.length;
        lastError = 'Expo push API returned invalid JSON';
        continue;
      }

      const counts = parseTicketCounts(chunk, payload);
      sent += counts.sent;
      failed += counts.failed;
      deadTokens.push(...counts.deadTokens);
      batches += 1;
    } catch {
      failed += chunk.length;
      lastError = 'Expo push network failure';
    }
  }

  deactivated = await deactivatePushTokens(options?.supabase, deadTokens);

  if (deadTokens.length) {
    logAudit(
      { requestId: 'push-delivery', method: 'POST', path: '/notifications/digest' },
      'push_ticket_errors',
      { dead: deadTokens.length, deactivated },
    );
  }

  return { requested, sent, failed, batches, deactivated, error: lastError };
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

  const delivery = await sendExpoPushBatch(expoPushTokens, result.summary, { supabase });
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
