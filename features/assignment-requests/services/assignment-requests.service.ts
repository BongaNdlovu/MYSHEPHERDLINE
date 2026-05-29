import { createAppError, fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';
import { getCurrentOrganizationId } from '@/lib/core/tenant';
import type { AssignmentRequest, AssignmentRequestStatus } from '@/types/database';

export const ASSIGNMENT_REQUEST_COLUMNS = '*';

export type AssignmentRequestDetail = AssignmentRequest & {
  memberName: string | null;
  taskTitle: string | null;
  requestedByName: string | null;
};

export async function createAssignmentRequest(input: {
  memberId?: string;
  taskId?: string;
  reason: string;
}): Promise<AssignmentRequest> {
  if (!input.memberId && !input.taskId) {
    throw new Error('Member or task is required.');
  }

  const reason = input.reason.trim();
  if (!reason) {
    throw createAppError('validation', 'Please describe why you need an assignment change.');
  }

  const supabase = requireSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw fromSupabaseError(authError, 'Unable to submit assignment request.');
  const requestedBy = auth.user?.id;
  if (!requestedBy) throw createAppError('auth', 'Sign in to submit assignment requests.');

  const { data, error } = await supabase
    .from('assignment_requests')
    .insert({
      organization_id: await getCurrentOrganizationId(),
      member_id: input.memberId ?? null,
      task_id: input.taskId ?? null,
      requested_by: requestedBy,
      reason,
      status: 'pending',
    })
    .select(ASSIGNMENT_REQUEST_COLUMNS)
    .single();

  if (error) throw fromSupabaseError(error, 'Unable to submit assignment request.');
  return data as AssignmentRequest;
}

export async function fetchPendingAssignmentRequests(): Promise<AssignmentRequestDetail[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('assignment_requests')
    .select(ASSIGNMENT_REQUEST_COLUMNS)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw fromSupabaseError(error, 'Unable to load assignment requests.');

  const requests = (data ?? []) as AssignmentRequest[];
  const memberIds = [
    ...new Set(requests.map((r) => r.member_id).filter((id): id is string => Boolean(id))),
  ];
  const taskIds = [
    ...new Set(requests.map((r) => r.task_id).filter((id): id is string => Boolean(id))),
  ];
  const requesterIds = [
    ...new Set(requests.map((r) => r.requested_by).filter((id): id is string => Boolean(id))),
  ];

  const memberMap = new Map<string, string>();
  const taskMap = new Map<string, string>();
  const requesterMap = new Map<string, string>();

  if (memberIds.length) {
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select('id, full_name')
      .in('id', memberIds);
    if (memberError) throw fromSupabaseError(memberError, 'Unable to load members.');
    for (const member of members ?? []) {
      memberMap.set(member.id as string, member.full_name as string);
    }
  }

  if (taskIds.length) {
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('id, title')
      .in('id', taskIds);
    if (taskError) throw fromSupabaseError(taskError, 'Unable to load tasks.');
    for (const task of tasks ?? []) {
      taskMap.set(task.id as string, task.title as string);
    }
  }

  if (requesterIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', requesterIds);
    if (profileError) throw fromSupabaseError(profileError, 'Unable to load profiles.');
    for (const profile of profiles ?? []) {
      requesterMap.set(profile.id as string, profile.display_name as string);
    }
  }

  return requests.map((request) => ({
    ...request,
    memberName: request.member_id ? (memberMap.get(request.member_id) ?? null) : null,
    taskTitle: request.task_id ? (taskMap.get(request.task_id) ?? null) : null,
    requestedByName: requesterMap.get(request.requested_by) ?? null,
  }));
}

export async function reviewAssignmentRequest(
  id: string,
  status: Extract<AssignmentRequestStatus, 'approved' | 'rejected'>,
): Promise<AssignmentRequest> {
  const supabase = requireSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const reviewerId = auth.user?.id;
  if (!reviewerId) throw createAppError('auth', 'Not authenticated.');

  const { data, error } = await supabase
    .from('assignment_requests')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(ASSIGNMENT_REQUEST_COLUMNS)
    .single();

  if (error) throw fromSupabaseError(error, 'Unable to review assignment request.');
  return data as AssignmentRequest;
}
