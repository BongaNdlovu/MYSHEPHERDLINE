import { useCallback, useEffect, useState } from 'react';

import { buildReportSummary } from '@/features/reports/selectors/reports';
import { fetchLocalReportInputs, fetchWorkerSummary } from '@/features/reports/services/reports.service';
import { getAppEnv } from '@/lib/core/env';
import { useAuth } from '@/lib/core/auth';
import type { AppError } from '@/lib/core/errors';
import { createAppError, toAppError } from '@/lib/core/errors';
import type { ReportSummary } from '@/types/database';

type ReportState = {
  summary: ReportSummary | null;
  loading: boolean;
  error: AppError | null;
  source: 'worker' | 'supabase' | null;
  workerUnavailable: boolean;
  refresh: () => Promise<void>;
  lastLoadedAt: number | null;
};

export function useReportSummary(): ReportState {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [source, setSource] = useState<'worker' | 'supabase' | null>(null);
  const [workerUnavailable, setWorkerUnavailable] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const allowFallback = getAppEnv().allowReportFallback;

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setSummary(null);
      setLoading(false);
      setError(createAppError('auth', 'Sign in to view reports.'));
      setSource(null);
      setWorkerUnavailable(false);
      return;
    }

    setLoading(true);
    setError(null);
    setWorkerUnavailable(false);

    const remote = await fetchWorkerSummary(accessToken);
    if (remote.ok) {
      setSummary(remote.data);
      setSource('worker');
      setLastLoadedAt(Date.now());
      setLoading(false);
      return;
    }

    setWorkerUnavailable(true);

    if (!allowFallback) {
      setSummary(null);
      setSource(null);
      setError(
        createAppError(
          'config',
          remote.reason === 'unconfigured'
            ? 'Reports require the Worker API. Set EXPO_PUBLIC_WORKER_API_URL.'
            : 'Report service is unavailable. Try again later.',
        ),
      );
      setLoading(false);
      return;
    }

    try {
      const inputs = await fetchLocalReportInputs();
      setSummary(buildReportSummary(inputs));
      setSource('supabase');
      setLastLoadedAt(Date.now());
    } catch (err) {
      setSummary(null);
      setSource(null);
      setError(toAppError(err, 'Unable to load reports.'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, allowFallback]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { summary, loading, error, source, workerUnavailable, refresh, lastLoadedAt };
}
