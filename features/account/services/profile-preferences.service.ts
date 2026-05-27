import { createAppError, fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';
import type { AccessRequest, Profile } from '@/types/database';

export const PROFILE_COLUMNS =
  'id, organization_id, email, display_name, role, is_active, preferred_district_id, preferred_organization_id, created_at, updated_at';

export async function updateProfilePreferences(input: {
  preferredDistrictId: string | null;
  preferredOrganizationId: string | null;
}): Promise<Profile> {
  const supabase = requireSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw createAppError('auth', 'Not authenticated.');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      preferred_district_id: input.preferredDistrictId,
      preferred_organization_id: input.preferredOrganizationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw fromSupabaseError(error, 'Unable to save profile preferences.');
  return data as Profile;
}

export async function submitAccessRequest(input: {
  email: string;
  displayName: string;
  preferredDistrictId: string | null;
  preferredOrganizationId: string | null;
  message?: string;
}): Promise<AccessRequest> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('access_requests')
    .insert({
      email: input.email.trim(),
      display_name: input.displayName.trim(),
      preferred_district_id: input.preferredDistrictId,
      preferred_organization_id: input.preferredOrganizationId,
      message: input.message?.trim() || null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw fromSupabaseError(error, 'Unable to submit access request.');
  return data as AccessRequest;
}
