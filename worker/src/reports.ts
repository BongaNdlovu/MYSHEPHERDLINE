import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthContext } from './auth';
import { getRecentActivityDays, type WorkerEnv } from './env';

export type ReportSummary = {
  membersNeedingAttention: number;
  visitsCompleted: number;
  tasksOpen: number;
  recentActivityDays: number;
  visitBreakdown: {
    visits: number;
    calls: number;
    bibleStudies: number;
    newConverts: number;
  };
};

type ReportCacheEntry = { summary: ReportSummary; expiresAt: number };

const reportCache = new Map<string, ReportCacheEntry>();
const CACHE_TTL_MS = 60_000;

function cacheKey(context: AuthContext, recentDays: number) {
  return `${context.organizationId}:${context.userId}:${context.role}:${recentDays}`;
}

function readCache(key: string): ReportSummary | null {
  const entry = reportCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    reportCache.delete(key);
    return null;
  }
  return entry.summary;
}

function writeCache(key: string, summary: ReportSummary) {
  reportCache.set(key, { summary, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function buildSummary(
  supabase: SupabaseClient,
  env: WorkerEnv,
  context: AuthContext,
): Promise<ReportSummary> {
  const recentActivityDays = getRecentActivityDays(env);
  const key = cacheKey(context, recentActivityDays);
  const cached = readCache(key);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('worker_report_summary', {
    p_user_id: context.userId,
    p_organization_id: context.organizationId,
    p_role: context.role,
    p_recent_days: recentActivityDays,
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'Report aggregation failed');
  }

  const summary = data as ReportSummary;
  writeCache(key, summary);
  return summary;
}
