import { membersNeedingAttention } from '@/lib/domain/members';
import type { Member, ReportSummary, Task, Visit } from '@/types/database';

export const DEFAULT_RECENT_ACTIVITY_DAYS = 7;

export function buildReportSummary(input: {
  members: Member[];
  visits: Visit[];
  tasks: Task[];
  recentActivityDays?: number;
}): ReportSummary {
  const recentActivityDays = input.recentActivityDays ?? DEFAULT_RECENT_ACTIVITY_DAYS;
  const since = new Date();
  since.setDate(since.getDate() - recentActivityDays);

  const recentVisits = input.visits.filter(
    (visit) => new Date(visit.visited_at).getTime() >= since.getTime(),
  );

  const visitBreakdown = recentVisits.reduce(
    (acc, visit) => {
      if (visit.visit_type === 'visit') acc.visits += 1;
      if (visit.visit_type === 'call') acc.calls += 1;
      if (visit.visit_type === 'bible_study') acc.bibleStudies += 1;
      return acc;
    },
    { visits: 0, calls: 0, bibleStudies: 0, newConverts: 0 },
  );

  visitBreakdown.newConverts = input.members.filter((member) => member.status === 'new').length;

  return {
    membersNeedingAttention: membersNeedingAttention(input.members).length,
    visitsCompleted: recentVisits.length,
    tasksOpen: input.tasks.filter((task) => task.status === 'open').length,
    recentActivityDays,
    visitBreakdown,
  };
}
