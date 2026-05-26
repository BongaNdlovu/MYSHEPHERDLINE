import type { ReportSummary } from '@/types/database';

const workerBaseUrl = process.env.EXPO_PUBLIC_WORKER_API_URL ?? '';

function workerUrl(path: string) {
  if (!workerBaseUrl) return null;
  return `${workerBaseUrl.replace(/\/$/, '')}${path}`;
}

export async function fetchReportSummary(accessToken: string): Promise<ReportSummary | null> {
  const url = workerUrl('/reports/summary');
  if (!url) return null;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return response.json() as Promise<ReportSummary>;
}

export async function registerPushToken(
  accessToken: string,
  expoPushToken: string,
  deviceName: string,
) {
  const url = workerUrl('/notifications/register');
  if (!url) return;

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expoPushToken, deviceName }),
  });
}

export async function checkWorkerHealth(): Promise<boolean> {
  const url = workerUrl('/health');
  if (!url) return false;
  try {
    const response = await fetch(url);
    const data = (await response.json()) as { status?: string };
    return response.ok && data.status === 'healthy';
  } catch {
    return false;
  }
}
