import { createAppError, fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';
import { getCurrentOrganizationId } from '@/lib/core/tenant';
import type { AssignmentRequest, AssignmentRequestStatus } from '@/types/database';

export const ASSIGNMENT_REQUEST_COLUMNS = '*';

export async function createAssignmentRequest(input: {
  memberId?: string;
  taskId?: string;
  reason: string;
}): Promise<AssignmentRequest> {
  if (!input.memberId && !input.taskId) {
    throw new Error('Member or task is required.');
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('assignment_requests')
    .insert({
      organization_id: await getCurrentOrganizationId(),
      member_id: input.memberId ?? null,
      task_id: input.taskId ?? null,
      reason: input.reason.trim(),
      status: 'pending',
    })
    .select(ASSIGNMENT_REQUEST_COLUMNS)
    .single();

  if (error) throw fromSupabaseError(error, 'Unable to submit assignment request.');
  return data as AssignmentRequest;
}

export async function fetchPendingAssignmentRequests(): Promise<AssignmentRequest[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('assignment_requests')
    .select(ASSIGNMENT_REQUEST_COLUMNS)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw fromSupabaseError(error, 'Unable to load assignment requests.');
  return (data ?? []) as AssignmentRequest[];
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
