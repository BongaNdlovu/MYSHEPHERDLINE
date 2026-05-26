import { useCallback, useEffect, useState } from 'react';

import { buildReportSummary } from '@/lib/domain/reports';
import { fetchReportSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { requireSupabase } from '@/lib/supabase';
import type { Member, ReportSummary, Task, Visit } from '@/types/database';

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

    const remote = await fetchReportSummary(session.access_token);
    if (remote) {
      setSummary(remote);
      setSource('worker');
      setLoading(false);
      return;
    }

    try {
      const supabase = requireSupabase();
      const recentDays = 7;
      const since = new Date();
      since.setDate(since.getDate() - recentDays);

      const [membersResult, visitsResult, tasksResult] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('visits').select('*').gte('visited_at', since.toISOString()),
        supabase.from('tasks').select('*'),
      ]);

      if (membersResult.error) throw new Error(membersResult.error.message);
      if (visitsResult.error) throw new Error(visitsResult.error.message);
      if (tasksResult.error) throw new Error(tasksResult.error.message);

      setSummary(
        buildReportSummary({
          members: (membersResult.data ?? []) as Member[],
          visits: (visitsResult.data ?? []) as Visit[],
          tasks: (tasksResult.data ?? []) as Task[],
          recentActivityDays: recentDays,
        }),
      );
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
