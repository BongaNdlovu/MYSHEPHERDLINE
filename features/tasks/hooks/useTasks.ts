import { useCallback, useRef, useState } from 'react';

import {
  fetchTaskById,
  fetchTasksPage,
  updateTaskStatus,
  type TaskListQuery,
} from '@/features/tasks/services/tasks.service';
import type { AppError } from '@/lib/core/errors';
import { notFoundError, toAppError } from '@/lib/core/errors';
import type { PaginatedQueryState, QueryState } from '@/lib/core/query-types';
import { usePaginatedQuery } from '@/lib/core/usePaginatedQuery';
import { useQuery } from '@/lib/core/useQuery';
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
  const fetch = useCallback(async () => {
    const task = await fetchTaskById(id!);
    if (!task) throw notFoundError('Task');
    return task;
  }, [id]);

  return useQuery({
    deps: [id],
    enabled: Boolean(id),
    errorMessage: 'Unable to load task.',
    initialData: null,
    fetch,
    dataLength: (task) => (task ? 1 : 0),
  });
}
