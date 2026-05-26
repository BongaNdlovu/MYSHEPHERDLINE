import { fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';
import type { Profile, UserRole } from '@/types/database';

export async function fetchProfiles(): Promise<Profile[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('profiles').select('*').order('display_name');
  if (error) throw fromSupabaseError(error, 'Unable to load users.');
  return (data ?? []) as Profile[];
}

export async function updateProfileRole(userId: string, role: UserRole): Promise<Profile> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to update role.');
  return data as Profile;
}

export async function updateProfileAccess(userId: string, isActive: boolean): Promise<Profile> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to update access.');
  return data as Profile;
}
