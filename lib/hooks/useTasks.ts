import { useCallback, useEffect, useState } from 'react';

import { requireSupabase } from '@/lib/supabase';
import type { Task } from '@/types/database';

type QueryState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleTask: (task: Task) => Promise<string | null>;
};

export function useTasks(): QueryState<Task[]> {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = requireSupabase();
      const { data: rows, error: queryError } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date');
      if (queryError) throw new Error(queryError.message);
      setData((rows ?? []) as Task[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tasks.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleTask = useCallback(async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'open' : 'completed';
    setData((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)),
    );
    try {
      const supabase = requireSupabase();
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', task.id);
      if (updateError) throw new Error(updateError.message);
      return null;
    } catch (err) {
      await refresh();
      return err instanceof Error ? err.message : 'Unable to update task.';
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh, toggleTask };
}
