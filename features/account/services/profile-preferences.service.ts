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

export type AccessRequestDetail = AccessRequest & {
  districtName: string | null;
  organizationName: string | null;
};

export async function fetchPendingAccessRequests(): Promise<AccessRequestDetail[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw fromSupabaseError(error, 'Unable to load access requests.');

  const requests = (data ?? []) as AccessRequest[];
  const districtIds = [
    ...new Set(requests.map((r) => r.preferred_district_id).filter((id): id is string => Boolean(id))),
  ];
  const organizationIds = [
    ...new Set(
      requests.map((r) => r.preferred_organization_id).filter((id): id is string => Boolean(id)),
    ),
  ];

  const districtMap = new Map<string, string>();
  const organizationMap = new Map<string, string>();

  if (districtIds.length) {
    const { data: districts, error: districtError } = await supabase
      .from('districts')
      .select('id, name')
      .in('id', districtIds);
    if (districtError) throw fromSupabaseError(districtError, 'Unable to load districts.');
    for (const district of districts ?? []) {
      districtMap.set(district.id as string, district.name as string);
    }
  }

  if (organizationIds.length) {
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', organizationIds);
    if (orgError) throw fromSupabaseError(orgError, 'Unable to load congregations.');
    for (const organization of organizations ?? []) {
      organizationMap.set(organization.id as string, organization.name as string);
    }
  }

  return requests.map((request) => ({
    ...request,
    districtName: request.preferred_district_id
      ? (districtMap.get(request.preferred_district_id) ?? null)
      : null,
    organizationName: request.preferred_organization_id
      ? (organizationMap.get(request.preferred_organization_id) ?? null)
      : null,
  }));
}

export async function markAccessRequestReviewed(id: string): Promise<AccessRequest> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('access_requests')
    .update({
      status: 'reviewed',
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw fromSupabaseError(error, 'Unable to update access request.');
  return data as AccessRequest;
}
