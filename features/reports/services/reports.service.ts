import { fetchReportSummary as fetchWorkerReportSummary } from '@/lib/core/api';
import { getAppEnv } from '@/lib/core/env';
import { fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';

export async function fetchWorkerSummary(accessToken: string) {
  return fetchWorkerReportSummary(accessToken);
}

/** Dev / break-glass only — not for production steady state. */
export async function fetchLocalReportInputs(recentDays = 7) {
  if (!getAppEnv().allowReportFallback) {
    throw new Error('Local report fallback is disabled. Configure the Worker API for production reports.');
  }

  const supabase = requireSupabase();
  const since = new Date();
  since.setDate(since.getDate() - recentDays);

  const memberCols = 'id, risk_level, status, assigned_to, created_at';
  const visitCols = 'visit_type, visited_at, logged_by, member_id';
  const taskCols = 'status, assignee_id';

  const [membersResult, visitsResult, tasksResult] = await Promise.all([
    supabase.from('members').select(memberCols),
    supabase.from('visits').select(visitCols).gte('visited_at', since.toISOString()),
    supabase.from('tasks').select(taskCols),
  ]);

  if (membersResult.error) throw fromSupabaseError(membersResult.error, 'Unable to load reports.');
  if (visitsResult.error) throw fromSupabaseError(visitsResult.error, 'Unable to load reports.');
  if (tasksResult.error) throw fromSupabaseError(tasksResult.error, 'Unable to load reports.');

  return {
    members: membersResult.data ?? [],
    visits: visitsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    recentActivityDays: recentDays,
  };
}
