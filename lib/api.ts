import { getAppEnv } from '@/lib/config/env';
import type { ReportSummary } from '@/types/database';

function workerUrl(path: string) {
  const { workerApiUrl } = getAppEnv();
  if (!workerApiUrl) return null;
  return `${workerApiUrl.replace(/\/$/, '')}${path}`;
}

export async function fetchReportSummary(accessToken: string): Promise<ReportSummary | null> {
  const url = workerUrl('/reports/summary');
  if (!url) return null;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    return response.json() as Promise<ReportSummary>;
  } catch {
    return null;
  }
}

export async function registerPushToken(
  accessToken: string,
  expoPushToken: string,
  deviceName: string,
) {
  const url = workerUrl('/notifications/register');
  if (!url) return { error: 'Worker API URL is not configured.' };

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
    return { error: body?.error ?? 'Unable to register push token.' };
  }

  return { error: null };
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
