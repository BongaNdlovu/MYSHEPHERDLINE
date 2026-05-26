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
  const payload = {
    member_id: input.memberId,
    logged_by: input.userId,
    visit_type: input.visitType,
    notes: input.notes,
    follow_up_required: input.followUpRequired,
    visited_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('visits').insert(payload);
  if (error) return error.message;

  const { error: memberError } = await supabase
    .from('members')
    .update({ last_contact_at: payload.visited_at })
    .eq('id', input.memberId);

  return memberError?.message ?? null;
}
