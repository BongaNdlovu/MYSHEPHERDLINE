import { buildRecentReportSummary } from '@/features/reports/selectors/reports';
import { MEMBERS_NEEDING_ATTENTION_OR_FILTER } from '@/features/members/selectors/members';
import { fetchReportSummary as fetchWorkerReportSummary } from '@/lib/core/api';
import { getAppEnv } from '@/lib/core/env';
import { createAppError, fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';

export async function fetchWorkerSummary(accessToken: string) {
  return fetchWorkerReportSummary(accessToken);
}

/** Dev / break-glass only - not for production steady state. */
export async function fetchLocalReportSummary(recentDays = 7) {
  if (!getAppEnv().allowReportFallback) {
    throw createAppError(
      'config',
      'Local report fallback is disabled. Configure the Worker API for production reports.',
    );
  }

  const supabase = requireSupabase();
  const since = new Date();
  since.setDate(since.getDate() - recentDays);

  const [membersResult, visitsResult, tasksCountResult] = await Promise.all([
    supabase
      .from('members')
      .select('risk_level, status, created_at')
      .or(MEMBERS_NEEDING_ATTENTION_OR_FILTER),
    supabase.from('visits').select('visit_type, visited_at').gte('visited_at', since.toISOString()),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  if (membersResult.error) throw fromSupabaseError(membersResult.error, 'Unable to load reports.');
  if (visitsResult.error) throw fromSupabaseError(visitsResult.error, 'Unable to load reports.');
  if (tasksCountResult.error) throw fromSupabaseError(tasksCountResult.error, 'Unable to load reports.');

  const attentionMembers = membersResult.data ?? [];
  const recentVisits = visitsResult.data ?? [];

  return buildRecentReportSummary({
    membersNeedingAttention: attentionMembers.length,
    recentVisits,
    tasksOpen: tasksCountResult.count ?? 0,
    newConverts: attentionMembers.filter(
      (member) =>
        member.status === 'new' && new Date(member.created_at).getTime() >= since.getTime(),
    ).length,
    recentActivityDays: recentDays,
  });
}
