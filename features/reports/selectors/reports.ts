import type { WorkerReportResult } from '@/lib/core/api';
import { createAppError, type AppError } from '@/lib/core/errors';
import { membersNeedingAttention } from '@/features/members/selectors/members';
import type { Member, ReportSummary, Task, Visit } from '@/types/database';

export const DEFAULT_RECENT_ACTIVITY_DAYS = 7;

type ReportMember = Pick<Member, 'risk_level' | 'status' | 'created_at'>;
type ReportVisit = Pick<Visit, 'visit_type' | 'visited_at'>;
type ReportTask = Pick<Task, 'status'>;
type ReportFailureResult = Extract<WorkerReportResult, { ok: false }>;

function recentSince(recentActivityDays: number) {
  const since = new Date();
  since.setDate(since.getDate() - recentActivityDays);
  return since;
}

export function buildRecentReportSummary(input: {
  membersNeedingAttention: number;
  recentVisits: ReportVisit[];
  tasksOpen: number;
  newConverts: number;
  recentActivityDays?: number;
}): ReportSummary {
  const recentActivityDays = input.recentActivityDays ?? DEFAULT_RECENT_ACTIVITY_DAYS;

  const visitBreakdown = input.recentVisits.reduce(
    (acc, visit) => {
      if (visit.visit_type === 'visit') acc.visits += 1;
      if (visit.visit_type === 'call') acc.calls += 1;
      if (visit.visit_type === 'bible_study') acc.bibleStudies += 1;
      return acc;
    },
    { visits: 0, calls: 0, bibleStudies: 0, newConverts: input.newConverts },
  );

  return {
    membersNeedingAttention: input.membersNeedingAttention,
    visitsCompleted: input.recentVisits.length,
    tasksOpen: input.tasksOpen,
    recentActivityDays,
    visitBreakdown,
  };
}

export function buildReportSummary(input: {
  members: ReportMember[];
  visits: ReportVisit[];
  tasks: ReportTask[];
  recentActivityDays?: number;
}): ReportSummary {
  const recentActivityDays = input.recentActivityDays ?? DEFAULT_RECENT_ACTIVITY_DAYS;
  const since = recentSince(recentActivityDays);

  const recentVisits = input.visits.filter(
    (visit) => new Date(visit.visited_at).getTime() >= since.getTime(),
  );
  const newConverts = input.members.filter(
    (member) => member.status === 'new' && new Date(member.created_at).getTime() >= since.getTime(),
  ).length;

  return buildRecentReportSummary({
    membersNeedingAttention: membersNeedingAttention(input.members).length,
    recentVisits,
    tasksOpen: input.tasks.filter((task) => task.status === 'open').length,
    newConverts,
    recentActivityDays,
  });
}

export function resolveReportFailure(
  result: ReportFailureResult,
  allowFallback: boolean,
): {
  shouldUseFallback: boolean;
  workerUnavailable: boolean;
  error: AppError | null;
} {
  switch (result.reason) {
    case 'auth':
      return {
        shouldUseFallback: false,
        workerUnavailable: false,
        error: createAppError('auth', 'Your session expired. Sign in again.'),
      };
    case 'forbidden':
      return {
        shouldUseFallback: false,
        workerUnavailable: false,
        error: createAppError('forbidden', 'You do not have permission to view reports.'),
      };
    case 'unconfigured':
      return allowFallback
        ? { shouldUseFallback: true, workerUnavailable: false, error: null }
        : {
            shouldUseFallback: false,
            workerUnavailable: false,
            error: createAppError('config', 'Reports require the Worker API. Set EXPO_PUBLIC_WORKER_API_URL.'),
          };
    case 'network':
      return allowFallback
        ? { shouldUseFallback: true, workerUnavailable: true, error: null }
        : {
            shouldUseFallback: false,
            workerUnavailable: true,
            error: createAppError('network', 'Unable to reach the report service. Check your connection and try again.'),
          };
    case 'invalid_response':
      return allowFallback
        ? { shouldUseFallback: true, workerUnavailable: true, error: null }
        : {
            shouldUseFallback: false,
            workerUnavailable: true,
            error: createAppError('server', 'Report service returned invalid data. Try again later.'),
          };
    case 'server':
    default:
      return allowFallback
        ? { shouldUseFallback: true, workerUnavailable: true, error: null }
        : {
            shouldUseFallback: false,
            workerUnavailable: true,
            error: createAppError('server', 'Report service is unavailable. Try again later.'),
          };
  }
}
