import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthContext } from './auth';
import type { WorkerEnv } from './env';
import { buildSummary, type ReportSummary } from './reports';
import { sendExpoPushBatch, type PushDeliveryResult } from './push-delivery';

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
