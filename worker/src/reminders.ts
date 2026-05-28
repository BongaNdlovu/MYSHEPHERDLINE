import type { SupabaseClient } from '@supabase/supabase-js';

import { logAudit } from './logger';
import { deactivatePushTokens, parseTicketCounts, sendExpoMessages } from './push-delivery';

export type TaskReminderRow = {
  id: string;
  organization_id: string;
  title: string;
  due_at: string;
  assignee_id: string | null;
};

export type TaskReminderSendResult =
  | { sent: number; tasks: number; marked: number }
  | { error: string };

const DEFAULT_REMINDER_WINDOW_MINUTES = 60;

function reminderBody(title: string, dueAt: string) {
  const dueLabel = new Date(dueAt).toLocaleString();
  return `Care follow-up due soon: ${title} (${dueLabel})`;
}

export async function listTasksDueForReminder(
  supabase: SupabaseClient,
  windowMinutes = DEFAULT_REMINDER_WINDOW_MINUTES,
): Promise<{ tasks: TaskReminderRow[]; error?: string }> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60_000);

  const { data, error } = await supabase
    .from('tasks')
    .select('id, organization_id, title, due_at, assignee_id')
    .eq('status', 'open')
    .not('due_at', 'is', null)
    .is('reminder_sent_at', null)
    .gte('due_at', now.toISOString())
    .lte('due_at', windowEnd.toISOString());

  if (error) return { tasks: [], error: error.message };
  return { tasks: (data ?? []) as TaskReminderRow[] };
}

export async function fetchPushTokensForUser(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) return [];
  return (data ?? [])
    .map((row) => row.expo_push_token as string | null)
    .filter((token): token is string => Boolean(token));
}

async function markReminderSent(supabase: SupabaseClient, taskIds: string[]) {
  if (!taskIds.length) return 0;
  const { error } = await supabase
    .from('tasks')
    .update({ reminder_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .in('id', taskIds);

  if (error) {
    logAudit(
      { requestId: 'task-reminders', method: 'POST', path: '/notifications/send-reminders' },
      'task_reminder_mark_failed',
      { count: taskIds.length, message: error.message },
    );
    return 0;
  }
  return taskIds.length;
}

async function sendTaskReminderBatch(
  tokens: string[],
  task: TaskReminderRow,
  supabase: SupabaseClient,
): Promise<{ sent: number; ok: boolean }> {
  if (!tokens.length) return { sent: 0, ok: false };

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title: 'Care follow-up reminder',
    body: reminderBody(task.title, task.due_at),
    data: { taskId: task.id, type: 'task_reminder' },
  }));

  const response = await sendExpoMessages(messages);
  if (!response.ok) return { sent: 0, ok: false };

  const counts = parseTicketCounts(tokens, response.payload);
  await deactivatePushTokens(supabase, counts.deadTokens);
  return { sent: counts.sent, ok: counts.sent > 0 };
}

export async function sendTaskReminderPushes(
  supabase: SupabaseClient,
  tasks: TaskReminderRow[],
): Promise<{ sent: number; marked: number }> {
  let sent = 0;
  const markedIds: string[] = [];

  for (const task of tasks) {
    if (!task.assignee_id) continue;

    const tokens = await fetchPushTokensForUser(supabase, task.organization_id, task.assignee_id);
    if (!tokens.length) continue;

    const result = await sendTaskReminderBatch(tokens, task, supabase);
    if (result.ok) {
      sent += result.sent;
      markedIds.push(task.id);
    } else {
      logAudit(
        { requestId: 'task-reminders', method: 'POST', path: '/notifications/send-reminders' },
        'task_reminder_push_failed',
        { taskId: task.id },
      );
    }
  }

  const marked = await markReminderSent(supabase, markedIds);
  return { sent, marked };
}

export async function sendTaskReminders(
  supabase: SupabaseClient,
  windowMinutes = DEFAULT_REMINDER_WINDOW_MINUTES,
): Promise<TaskReminderSendResult> {
  const { tasks, error } = await listTasksDueForReminder(supabase, windowMinutes);
  if (error) return { error };
  if (!tasks.length) return { sent: 0, tasks: 0, marked: 0 };

  const { sent, marked } = await sendTaskReminderPushes(supabase, tasks);
  return { sent, tasks: tasks.length, marked };
}
