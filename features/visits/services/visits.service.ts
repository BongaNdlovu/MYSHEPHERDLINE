import { fromSupabaseError } from '@/lib/core/errors';
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
  const { data: member } = await supabase
    .from('members')
    .select('organization_id')
    .eq('id', input.memberId)
    .maybeSingle();

  const payload = {
    organization_id: member?.organization_id,
    member_id: input.memberId,
    logged_by: input.userId,
    visit_type: input.visitType,
    notes: input.notes,
    follow_up_required: input.followUpRequired,
    visited_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('visits').insert(payload);
  if (error) throw fromSupabaseError(error, 'Unable to save visit.');

  const { error: memberError } = await supabase
    .from('members')
    .update({ last_contact_at: payload.visited_at })
    .eq('id', input.memberId);

  if (memberError) throw fromSupabaseError(memberError, 'Visit saved, but member contact date could not be updated.');
}
