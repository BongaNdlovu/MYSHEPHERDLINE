import { requireAssigneeId } from '@/features/admin/selectors/assignees';
import { fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';
import type { Task } from '@/types/database';

export async function fetchTasks(): Promise<Task[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('tasks').select('*').order('due_date');
  if (error) throw fromSupabaseError(error, 'Unable to load tasks.');
  return (data ?? []) as Task[];
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
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assignee_id: assigneeId,
      member_id: input.member_id ?? null,
      due_date: input.due_date ?? null,
      status: input.status ?? 'open',
      priority: input.priority ?? 'medium',
      task_type: input.task_type?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to create task.');
  return data as Task;
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const assigneeId = requireAssigneeId(input.assignee_id, 'task');
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assignee_id: assigneeId,
      member_id: input.member_id ?? null,
      due_date: input.due_date ?? null,
      status: input.status,
      priority: input.priority,
      task_type: input.task_type?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to update task.');
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw fromSupabaseError(error, 'Unable to delete task.');
}
