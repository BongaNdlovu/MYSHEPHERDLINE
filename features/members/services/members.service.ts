import { fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';
import type { Member } from '@/types/database';

export async function fetchMembers(): Promise<Member[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('members').select('*').order('full_name');
  if (error) throw fromSupabaseError(error, 'Unable to load members.');
  return (data ?? []) as Member[];
}

export async function fetchMemberById(id: string): Promise<Member | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle();
  if (error) throw fromSupabaseError(error, 'Unable to load member.');
  return (data as Member | null) ?? null;
}
