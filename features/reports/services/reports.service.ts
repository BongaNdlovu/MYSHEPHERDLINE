import { fetchReportSummary as fetchWorkerReportSummary } from '@/lib/core/api';
import { fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';
import type { Member, Task, Visit } from '@/types/database';

export async function fetchWorkerSummary(accessToken: string) {
  return fetchWorkerReportSummary(accessToken);
}

export async function fetchLocalReportInputs(recentDays = 7) {
  const supabase = requireSupabase();
  const since = new Date();
  since.setDate(since.getDate() - recentDays);

  const [membersResult, visitsResult, tasksResult] = await Promise.all([
    supabase.from('members').select('*'),
    supabase.from('visits').select('*').gte('visited_at', since.toISOString()),
    supabase.from('tasks').select('*'),
  ]);

  if (membersResult.error) throw fromSupabaseError(membersResult.error, 'Unable to load reports.');
  if (visitsResult.error) throw fromSupabaseError(visitsResult.error, 'Unable to load reports.');
  if (tasksResult.error) throw fromSupabaseError(tasksResult.error, 'Unable to load reports.');

  return {
    members: (membersResult.data ?? []) as Member[],
    visits: (visitsResult.data ?? []) as Visit[],
    tasks: (tasksResult.data ?? []) as Task[],
    recentActivityDays: recentDays,
  };
}
