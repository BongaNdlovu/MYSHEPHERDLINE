import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchTasksPage,
  updateTaskStatus,
  type TaskListQuery,
} from '@/features/tasks/services/tasks.service';
import type { AppError } from '@/lib/core/errors';
import { toAppError } from '@/lib/core/errors';
import { appendUniquePage } from '@/lib/core/paginated-state';
import { computeIsStale, type PaginatedQueryState } from '@/lib/core/query-types';
import type { TaskListRow } from '@/types/database';

export type UseTasksOptions = Omit<TaskListQuery, 'page'>;

type TasksState = PaginatedQueryState<TaskListRow> & {
  toggleTask: (task: TaskListRow) => Promise<AppError | null>;
  isTaskToggling: (taskId: string) => boolean;
};

export function useTasks(options: UseTasksOptions = {}): TasksState {
  const [data, setData] = useState<TaskListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);
  const togglingRef = useRef(new Set<string>());
  const [togglingIds, setTogglingIds] = useState<ReadonlySet<string>>(() => new Set());

  const syncTogglingIds = useCallback(() => {
    setTogglingIds(new Set(togglingRef.current));
  }, []);

  const loadPage = useCallback(async (pageToLoad: number, append: boolean) => {
    const requestId = ++requestIdRef.current;

    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetchTasksPage({
        page: pageToLoad,
        pageSize: options.pageSize,
        status: options.status,
        assigneeId: options.assigneeId,
      });
      if (requestId !== requestIdRef.current) return;

      setData((current) => (append ? appendUniquePage(current, result.items) : result.items));
      setPage(result.page);
      setHasMore(result.hasMore);
      setLastLoadedAt(Date.now());
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(toAppError(err, 'Unable to load tasks.'));
      if (!append) setData([]);
      setHasMore(false);
    } finally {
      if (requestId !== requestIdRef.current) return;

      setLoading(false);
      setLoadingMore(false);
    }
  }, [options.assigneeId, options.pageSize, options.status]);

  const refresh = useCallback(async () => {
    await loadPage(0, false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      await loadPage(page + 1, true);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [hasMore, loadPage, loading, loadingMore, page]);

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
    [syncTogglingIds],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPage(0, false);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPage, options.status, options.assigneeId, options.pageSize]);

  const isStale = useMemo(
    () => computeIsStale({ loading, loadingMore, error, lastLoadedAt, dataLength: data.length }),
    [data.length, error, lastLoadedAt, loading, loadingMore],
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
