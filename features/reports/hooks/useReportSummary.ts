import { useCallback, useEffect, useState } from 'react';

import { buildReportSummary } from '@/features/reports/selectors/reports';
import { fetchLocalReportInputs, fetchWorkerSummary } from '@/features/reports/services/reports.service';
import { useAuth } from '@/lib/core/auth';
import type { ReportSummary } from '@/types/database';

type ReportState = {
  summary: ReportSummary | null;
  loading: boolean;
  error: string | null;
  source: 'worker' | 'supabase' | null;
  refresh: () => Promise<void>;
};

export function useReportSummary(): ReportState {
  const { session } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'worker' | 'supabase' | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setSummary(null);
      setLoading(false);
      setError('Sign in to view reports.');
      setSource(null);
      return;
    }

    setLoading(true);
    setError(null);

    const remote = await fetchWorkerSummary(session.access_token);
    if (remote) {
      setSummary(remote);
      setSource('worker');
      setLoading(false);
      return;
    }

    try {
      const inputs = await fetchLocalReportInputs();
      setSummary(buildReportSummary(inputs));
      setSource('supabase');
    } catch (err) {
      setSummary(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, source, refresh };
}
