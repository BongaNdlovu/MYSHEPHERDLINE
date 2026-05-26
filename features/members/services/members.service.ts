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

export type MemberInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  risk_level?: Member['risk_level'];
  status?: Member['status'];
  notes?: string | null;
  assigned_to?: string | null;
};

export async function createMember(input: MemberInput): Promise<Member> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('members')
    .insert({
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      risk_level: input.risk_level ?? 'low',
      status: input.status ?? 'new',
      notes: input.notes?.trim() || null,
      assigned_to: input.assigned_to ?? null,
    })
    .select('*')
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to create member.');
  return data as Member;
}

export async function updateMember(id: string, input: MemberInput): Promise<Member> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('members')
    .update({
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      risk_level: input.risk_level,
      status: input.status,
      notes: input.notes?.trim() || null,
      assigned_to: input.assigned_to ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to update member.');
  return data as Member;
}

export async function deleteMember(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw fromSupabaseError(error, 'Unable to delete member.');
}
