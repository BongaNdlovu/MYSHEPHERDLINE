import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchTaskById,
  fetchTasksPage,
  updateTaskStatus,
  type TaskListQuery,
} from '@/features/tasks/services/tasks.service';
import type { AppError } from '@/lib/core/errors';
import { notFoundError, toAppError } from '@/lib/core/errors';
import { computeIsStale, type PaginatedQueryState, type QueryState } from '@/lib/core/query-types';
import { usePaginatedQuery } from '@/lib/core/usePaginatedQuery';
import type { Task, TaskListRow } from '@/types/database';

export type UseTasksOptions = Omit<TaskListQuery, 'page'>;

type TasksState = PaginatedQueryState<TaskListRow> & {
  toggleTask: (task: TaskListRow) => Promise<AppError | null>;
  isTaskToggling: (taskId: string) => boolean;
};

export function useTasks(options: UseTasksOptions = {}): TasksState {
  const fetchPage = useCallback(
    (page: number) =>
      fetchTasksPage({
        page,
        pageSize: options.pageSize,
        status: options.status,
        assigneeId: options.assigneeId,
      }),
    [options.assigneeId, options.pageSize, options.status],
  );

  const {
    data,
    setData,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    page,
    hasMore,
    lastLoadedAt,
    isStale,
  } = usePaginatedQuery({
    fetchPage,
    deps: [options.assigneeId, options.pageSize, options.status],
    errorMessage: 'Unable to load tasks.',
  });

  const togglingRef = useRef(new Set<string>());
  const [togglingIds, setTogglingIds] = useState<ReadonlySet<string>>(() => new Set());

  const syncTogglingIds = useCallback(() => {
    setTogglingIds(new Set(togglingRef.current));
  }, []);

  const isTaskToggling = useCallback((taskId: string) => togglingIds.has(taskId), [togglingIds]);

  const toggleTask = useCallback(
    async (task: TaskListRow) => {
      if (togglingRef.current.has(task.id)) return null;

      const previousStatus = task.status;
      const nextStatus = previousStatus === 'completed' ? 'open' : 'completed';
      togglingRef.current.add(task.id);
      syncTogglingIds();
      setData((current) =>
        current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)),
      );
      try {
        await updateTaskStatus(task.id, nextStatus);
        return null;
      } catch (err) {
        setData((current) =>
          current.map((item) =>
            item.id === task.id ? { ...item, status: previousStatus } : item,
          ),
        );
        return toAppError(err, 'Unable to update task.');
      } finally {
        togglingRef.current.delete(task.id);
        syncTogglingIds();
      }
    },
    [setData, syncTogglingIds],
  );

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
    isStale,
    toggleTask,
    isTaskToggling,
  };
}

export function useTask(id: string | undefined): QueryState<Task | null> {
  const [data, setData] = useState<Task | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const task = await fetchTaskById(id);
      if (!task) {
        setData(null);
        setError(notFoundError('Task'));
        return;
      }
      setData(task);
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load task.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const isStale = useMemo(
    () => computeIsStale({ loading, error, lastLoadedAt, dataLength: data ? 1 : 0 }),
    [data, error, lastLoadedAt, loading],
  );

  return { data, loading, error, refresh, lastLoadedAt, isStale };
}
