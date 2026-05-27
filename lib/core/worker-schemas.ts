import type { ReportSummary } from '@/types/database';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseVisitBreakdown(value: unknown): ReportSummary['visitBreakdown'] | null {
  if (!isRecord(value)) return null;
  const visits = value.visits;
  const calls = value.calls;
  const bibleStudies = value.bibleStudies;
  const newConverts = value.newConverts;
  if (
    !isFiniteNumber(visits) ||
    !isFiniteNumber(calls) ||
    !isFiniteNumber(bibleStudies) ||
    !isFiniteNumber(newConverts)
  ) {
    return null;
  }
  return { visits, calls, bibleStudies, newConverts };
}

export function parseReportSummary(value: unknown): ReportSummary | null {
  if (!isRecord(value)) return null;

  const visitBreakdown = parseVisitBreakdown(value.visitBreakdown);
  if (
    !isFiniteNumber(value.membersNeedingAttention) ||
    !isFiniteNumber(value.visitsCompleted) ||
    !isFiniteNumber(value.tasksOpen) ||
    !isFiniteNumber(value.recentActivityDays) ||
    !visitBreakdown
  ) {
    return null;
  }

  return {
    membersNeedingAttention: value.membersNeedingAttention,
    visitsCompleted: value.visitsCompleted,
    tasksOpen: value.tasksOpen,
    recentActivityDays: value.recentActivityDays,
    visitBreakdown,
  };
}

export function parseHealthStatus(value: unknown): string | null {
  if (!isRecord(value) || typeof value.status !== 'string') return null;
  return value.status;
}
