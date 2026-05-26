import { getAppEnv } from '@/lib/core/env';
import { createAppError, fromFetchFailure, fromHttpStatus } from '@/lib/core/errors';
import type { AppError } from '@/lib/core/errors';
import type { ReportSummary } from '@/types/database';

function workerUrl(path: string) {
  const { workerApiUrl } = getAppEnv();
  if (!workerApiUrl) return null;
  return `${workerApiUrl.replace(/\/$/, '')}${path}`;
}

export type WorkerReportResult =
  | { ok: true; data: ReportSummary }
  | { ok: false; reason: 'unconfigured' | 'network' | 'auth' | 'forbidden' | 'server' };

export async function fetchReportSummary(accessToken: string): Promise<WorkerReportResult> {
  const url = workerUrl('/reports/summary');
  if (!url) return { ok: false, reason: 'unconfigured' };

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) return { ok: false, reason: 'auth' };
      if (response.status === 403) return { ok: false, reason: 'forbidden' };
      if (response.status >= 500) return { ok: false, reason: 'server' };
      return { ok: false, reason: 'network' };
    }

    return { ok: true, data: (await response.json()) as ReportSummary };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function registerPushToken(
  accessToken: string,
  expoPushToken: string,
  deviceName: string,
) {
  const url = workerUrl('/notifications/register');
  if (!url) {
    return { error: createAppError('config', 'Worker API URL is not configured.') };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expoPushToken, deviceName }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      return { error: fromHttpStatus(response.status, body?.error ?? 'Unable to register push token.') };
    }

    return { error: null as AppError | null };
  } catch {
    return { error: fromFetchFailure('Unable to register push token.') };
  }
}

export async function checkWorkerHealth(): Promise<boolean> {
  try {
    const url = workerUrl('/health');
    if (!url) return false;
    const response = await fetch(url);
    const data = (await response.json()) as { status?: string };
    return response.ok && data.status === 'healthy';
  } catch {
    return false;
  }
}
