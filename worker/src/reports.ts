import type { SupabaseClient } from '@supabase/supabase-js';

import { hasGlobalScope, type AuthContext } from './auth';
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

type MemberRow = { id: string; risk_level: string; status: string; assigned_to: string | null };
type VisitRow = { visit_type: string; visited_at: string; logged_by: string; member_id: string };
type TaskRow = { status: string; assignee_id: string | null };

function memberNeedsAttention(member: MemberRow) {
  return member.risk_level === 'high' || member.status === 'inactive' || member.status === 'new';
}

function scopeMembers(members: MemberRow[], context: AuthContext) {
  if (hasGlobalScope(context)) return members;
  return members.filter((member) => member.assigned_to === context.userId);
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
    supabase.from('members').select('id, risk_level, status, assigned_to'),
    supabase.from('visits').select('visit_type, visited_at, logged_by, member_id').gte('visited_at', since.toISOString()),
    supabase.from('tasks').select('status, assignee_id'),
  ]);

  const members = scopeMembers((membersResult.data ?? []) as MemberRow[], context);
  const assignedMemberIds = new Set(members.map((member) => member.id));

  const visits = ((visitsResult.data ?? []) as VisitRow[]).filter((visit) => {
    if (hasGlobalScope(context)) return true;
    return assignedMemberIds.has(visit.member_id);
  });
  const tasks = ((tasksResult.data ?? []) as TaskRow[]).filter(
    (task) => task.status === 'open' && (hasGlobalScope(context) || task.assignee_id === context.userId),
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
