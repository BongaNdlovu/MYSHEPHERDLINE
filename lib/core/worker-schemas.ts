export type { ReportSummary } from '../../shared/report-summary';
export { parseReportSummary } from '../../shared/report-summary';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseHealthStatus(value: unknown): string | null {
  if (!isRecord(value) || typeof value.status !== 'string') return null;
  return value.status;
}
