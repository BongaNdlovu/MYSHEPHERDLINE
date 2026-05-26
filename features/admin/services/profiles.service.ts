import { fromSupabaseError } from '@/lib/core/errors';
import {
  DEFAULT_PAGE_SIZE,
  hasMorePages,
  pageRange,
  type PageParams,
  type PaginatedResult,
} from '@/lib/core/pagination';
import { requireSupabase } from '@/lib/core/supabase';
import type { Profile } from '@/types/database';

export const PROFILE_LIST_COLUMNS =
  'id, organization_id, email, display_name, role, is_active, created_at, updated_at';

export async function fetchProfilesPage(query: PageParams = {}): Promise<PaginatedResult<Profile>> {
  const supabase = requireSupabase();
  const page = query.page ?? 0;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const { from, to } = pageRange(page, pageSize);

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_LIST_COLUMNS, { count: 'exact' })
    .order('display_name')
    .range(from, to);

  if (error) throw fromSupabaseError(error, 'Unable to load users.');
  const items = (data ?? []) as Profile[];
  return { items, page, pageSize, hasMore: hasMorePages(items.length, pageSize) };
}

/** @deprecated Prefer fetchProfilesPage. */
export async function fetchProfiles(): Promise<Profile[]> {
  const first = await fetchProfilesPage();
  return first.items;
}

export async function updateProfileRole(userId: string, role: Profile['role']): Promise<Profile> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select(PROFILE_LIST_COLUMNS)
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
    .select(PROFILE_LIST_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to update access.');
  return data as Profile;
}
