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
