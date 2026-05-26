import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchTasksPage,
  updateTaskStatus,
  type TaskListQuery,
} from '@/features/tasks/services/tasks.service';
import type { AppError } from '@/lib/core/errors';
import { toAppError } from '@/lib/core/errors';
import type { PaginatedQueryState } from '@/lib/core/query-types';
import type { TaskListRow } from '@/types/database';

export type UseTasksOptions = Omit<TaskListQuery, 'page'>;

type TasksState = PaginatedQueryState<TaskListRow> & {
  toggleTask: (task: TaskListRow) => Promise<AppError | null>;
};

export function useTasks(options: UseTasksOptions = {}): TasksState {
  const [data, setData] = useState<TaskListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const loadPage = useCallback(async (pageToLoad: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetchTasksPage({ ...optionsRef.current, page: pageToLoad });
      setData((current) => (append ? [...current, ...result.items] : result.items));
      setPage(result.page);
      setHasMore(result.hasMore);
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load tasks.'));
      if (!append) setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadPage(0, false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    await loadPage(page + 1, true);
  }, [hasMore, loadPage, loading, loadingMore, page]);

  const toggleTask = useCallback(
    async (task: TaskListRow) => {
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
    },
    [refresh],
  );

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage, options.status, options.assigneeId, options.pageSize]);

  return {
    data,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    page,
    hasMore,
    lastLoadedAt,
    isStale: false,
    toggleTask,
  };
}
