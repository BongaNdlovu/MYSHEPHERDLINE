import { createAppError, fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';
import type { Visit } from '@/types/database';

export async function createVisit(input: {
  memberId: string;
  userId: string;
  visitType: Visit['visit_type'];
  notes: string;
  followUpRequired: boolean;
}) {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc('log_visit', {
    p_member_id: input.memberId,
    p_visit_type: input.visitType,
    p_notes: input.notes,
    p_follow_up_required: input.followUpRequired,
  });

  if (error) {
    if (error.message.includes('Member not found')) {
      throw createAppError('not_found', 'Member not found.');
    }
    if (error.message.includes('Account deactivated')) {
      throw createAppError('auth', 'Your account is deactivated. Contact your administrator.');
    }
    throw fromSupabaseError(error, 'Unable to save visit.');
  }
}
