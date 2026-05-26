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

type MemberRow = { risk_level: string; status: string; assigned_to: string | null };
type VisitRow = { visit_type: string; visited_at: string; logged_by: string };
type TaskRow = { status: string; assignee_id: string | null };

function memberNeedsAttention(member: MemberRow) {
  return member.risk_level === 'high' || member.status === 'inactive' || member.status === 'new';
}

function scopeMembers(members: MemberRow[], context: AuthContext) {
  if (context.role === 'admin') return members;
  return members.filter(
    (member) => member.assigned_to === null || member.assigned_to === context.userId,
  );
}

export async function buildSummary(
  supabase: SupabaseClient,
  env: WorkerEnv,
  context: AuthContext,
): Promise<ReportSummary> {
  const recentActivityDays = getRecentActivityDays(env);
  const since = new Date();
  since.setDate(since.getDate() - recentActivityDays);

  const [membersResult, visitsResult, tasksResult] = await Promise.all([
    supabase.from('members').select('risk_level, status, assigned_to'),
    supabase.from('visits').select('visit_type, visited_at, logged_by').gte('visited_at', since.toISOString()),
    supabase.from('tasks').select('status, assignee_id'),
  ]);

  const members = scopeMembers((membersResult.data ?? []) as MemberRow[], context);
  const visits = ((visitsResult.data ?? []) as VisitRow[]).filter(
    (visit) => context.role === 'admin' || visit.logged_by === context.userId,
  );
  const tasks = ((tasksResult.data ?? []) as TaskRow[]).filter(
    (task) =>
      task.status === 'open' &&
      (context.role === 'admin' || task.assignee_id === null || task.assignee_id === context.userId),
  );

  const visitBreakdown = visits.reduce(
    (acc, visit) => {
      if (visit.visit_type === 'visit') acc.visits += 1;
      if (visit.visit_type === 'call') acc.calls += 1;
      if (visit.visit_type === 'bible_study') acc.bibleStudies += 1;
      return acc;
    },
    { visits: 0, calls: 0, bibleStudies: 0, newConverts: 0 },
  );

  visitBreakdown.newConverts = members.filter((member) => member.status === 'new').length;

  return {
    membersNeedingAttention: members.filter(memberNeedsAttention).length,
    visitsCompleted: visits.length,
    tasksOpen: tasks.length,
    recentActivityDays: recentActivityDays,
    visitBreakdown,
  };
}
