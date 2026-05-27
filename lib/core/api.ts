import { getAppEnv } from '@/lib/core/env';
import { createAppError, fromFetchFailure, fromHttpStatus } from '@/lib/core/errors';
import type { AppError } from '@/lib/core/errors';
import { fetchWithTimeout } from '@/lib/core/http';
import { parseHealthStatus, parseReportSummary } from '@/lib/core/worker-schemas';
import type { ReportSummary } from '@/types/database';

const JSON_HEADERS = {
  Accept: 'application/json',
} as const;

function workerUrl(path: string) {
  const { workerApiUrl } = getAppEnv();
  if (!workerApiUrl) return null;
  return `${workerApiUrl.replace(/\/$/, '')}${path}`;
}

export type WorkerReportResult =
  | { ok: true; data: ReportSummary }
  | { ok: false; reason: 'unconfigured' | 'network' | 'auth' | 'forbidden' | 'server' | 'invalid_response' };

export async function fetchReportSummary(accessToken: string): Promise<WorkerReportResult> {
  const url = workerUrl('/reports/summary');
  if (!url) return { ok: false, reason: 'unconfigured' };

  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) return { ok: false, reason: 'auth' };
      if (response.status === 403) return { ok: false, reason: 'forbidden' };
      if (response.status >= 500) return { ok: false, reason: 'server' };
      return { ok: false, reason: 'network' };
    }

    const body: unknown = await response.json();
    const data = parseReportSummary(body);
    if (!data) return { ok: false, reason: 'invalid_response' };

    return { ok: true, data };
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
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        ...JSON_HEADERS,
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
    const response = await fetchWithTimeout(url, { headers: JSON_HEADERS });
    const body: unknown = await response.json();
    const status = parseHealthStatus(body);
    return response.ok && status === 'healthy';
  } catch {
    return false;
  }
}
