import { useCallback, useEffect, useState } from 'react';

import { fetchTasks, updateTaskStatus } from '@/features/tasks/services/tasks.service';
import type { AppError } from '@/lib/core/errors';
import { toAppError } from '@/lib/core/errors';
import type { QueryState } from '@/lib/core/query-types';
import type { Task } from '@/types/database';

type TasksState = QueryState<Task[]> & {
  toggleTask: (task: Task) => Promise<AppError | null>;
};

export function useTasks(): TasksState {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchTasks());
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load tasks.'));
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
      await updateTaskStatus(task.id, nextStatus);
      return null;
    } catch (err) {
      await refresh();
      return toAppError(err, 'Unable to update task.');
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh, lastLoadedAt, isStale: false, toggleTask };
}
