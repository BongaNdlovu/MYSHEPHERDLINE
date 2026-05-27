import { fromSupabaseError } from '@/lib/core/errors';
import { getCurrentOrganizationId } from '@/lib/core/tenant';
import { requireSupabase } from '@/lib/core/supabase';
import type { District, Organization } from '@/types/database';

export type CongregationContext = {
  organization: Organization;
  district: District | null;
};

export async function fetchCongregationContext(): Promise<CongregationContext> {
  const supabase = requireSupabase();
  const organizationId = await getCurrentOrganizationId();

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, district_id, created_at, updated_at')
    .eq('id', organizationId)
    .single();

  if (orgError) {
    throw fromSupabaseError(orgError, 'Unable to load your congregation.');
  }

  if (!organization?.district_id) {
    return { organization: organization as Organization, district: null };
  }

  const { data: district, error: districtError } = await supabase
    .from('districts')
    .select('id, name, slug, created_at, updated_at')
    .eq('id', organization.district_id)
    .maybeSingle();

  if (districtError) {
    throw fromSupabaseError(districtError, 'Unable to load your district.');
  }

  return {
    organization: organization as Organization,
    district: (district as District | null) ?? null,
  };
}

export async function fetchDistrictCongregations(): Promise<Organization[]> {
  const supabase = requireSupabase();
  const { organization, district } = await fetchCongregationContext();

  if (!district) {
    return [organization];
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, district_id, created_at, updated_at')
    .eq('district_id', district.id)
    .order('name');

  if (error) {
    throw fromSupabaseError(error, 'Unable to load congregations in your district.');
  }

  return (data ?? []) as Organization[];
}

export async function fetchAllDistricts(): Promise<District[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('districts')
    .select('id, name, slug, created_at, updated_at')
    .order('name');

  if (error) throw fromSupabaseError(error, 'Unable to load districts.');
  return (data ?? []) as District[];
}

export async function fetchCongregationsByDistrict(districtId: string): Promise<Organization[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, district_id, created_at, updated_at')
    .eq('district_id', districtId)
    .order('name');

  if (error) throw fromSupabaseError(error, 'Unable to load congregations.');
  return (data ?? []) as Organization[];
}

export async function createCongregation(input: {
  name: string;
  slug: string;
  districtId: string | null;
}): Promise<Organization> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      district_id: input.districtId,
    })
    .select('id, name, slug, district_id, created_at, updated_at')
    .single();

  if (error) {
    throw fromSupabaseError(error, 'Unable to create congregation.');
  }

  return data as Organization;
}
