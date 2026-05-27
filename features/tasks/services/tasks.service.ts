import { requireAssigneeId } from '@/features/admin/selectors/assignees';
import { fromSupabaseError } from '@/lib/core/errors';
import {
  DEFAULT_PAGE_SIZE,
  hasMorePages,
  pageRange,
  type PageParams,
  type PaginatedResult,
} from '@/lib/core/pagination';
import { requireSupabase } from '@/lib/core/supabase';
import { getCurrentOrganizationId } from '@/lib/core/tenant';
import type { Task, TaskListRow } from '@/types/database';

export const TASK_LIST_COLUMNS =
  'id, organization_id, title, due_date, status, priority, assignee_id, member_id, task_type';

export const TASK_DETAIL_COLUMNS = '*';

export type TaskListQuery = PageParams & {
  status?: Task['status'];
  assigneeId?: string;
};

export async function fetchTasksPage(query: TaskListQuery = {}): Promise<PaginatedResult<TaskListRow>> {
  const supabase = requireSupabase();
  const page = query.page ?? 0;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const { from, to } = pageRange(page, pageSize);

  let request = supabase
    .from('tasks')
    .select(TASK_LIST_COLUMNS)
    .order('due_date', { ascending: true, nullsFirst: false })
    .range(from, to);

  if (query.status) request = request.eq('status', query.status);
  if (query.assigneeId) request = request.eq('assignee_id', query.assigneeId);

  const { data, error } = await request;
  if (error) throw fromSupabaseError(error, 'Unable to load tasks.');

  const items = (data ?? []) as TaskListRow[];
  return {
    items,
    page,
    pageSize,
    hasMore: hasMorePages(items.length, pageSize),
  };
}

export async function fetchTaskById(id: string): Promise<Task | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_DETAIL_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw fromSupabaseError(error, 'Unable to load task.');
  return (data as Task | null) ?? null;
}

export async function updateTaskStatus(taskId: string, status: Task['status']) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
  if (error) throw fromSupabaseError(error, 'Unable to update task.');
}

export type TaskInput = {
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  member_id?: string | null;
  due_date?: string | null;
  status?: Task['status'];
  priority?: Task['priority'];
  task_type?: string | null;
};

export async function createTask(input: TaskInput): Promise<Task> {
  const assigneeId = requireAssigneeId(input.assignee_id, 'task');
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      organization_id: await getCurrentOrganizationId(),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assignee_id: assigneeId,
      member_id: input.member_id ?? null,
      due_date: input.due_date ?? null,
      status: input.status ?? 'open',
      priority: input.priority ?? 'medium',
      task_type: input.task_type?.trim() || null,
    })
    .select(TASK_DETAIL_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to create task.');
  return data as Task;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.assignee_id !== undefined) {
    patch.assignee_id = requireAssigneeId(input.assignee_id, 'task');
  }
  if (input.member_id !== undefined) patch.member_id = input.member_id ?? null;
  if (input.due_date !== undefined) patch.due_date = input.due_date ?? null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.task_type !== undefined) patch.task_type = input.task_type?.trim() || null;

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select(TASK_DETAIL_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to update task.');
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw fromSupabaseError(error, 'Unable to delete task.');
}
