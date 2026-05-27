import { requireAssigneeId } from '@/features/admin/selectors/assignees';
import { fromSupabaseError } from '@/lib/core/errors';
import {
  DEFAULT_PAGE_SIZE,
  hasMorePages,
  pageRange,
  type PageParams,
  type PaginatedResult,
} from '@/lib/core/pagination';
import { requireSupabase } from '@/lib/core/supabase';
import { getCurrentOrganizationId } from '@/lib/core/tenant';
import { escapeLikePattern } from '@/lib/core/validation';
import type { Member, MemberListRow } from '@/types/database';

export const MEMBER_LIST_COLUMNS =
  'id, organization_id, full_name, phone, risk_level, status, last_contact_at, assigned_to';

export const MEMBER_DETAIL_COLUMNS = '*';

export type MemberListQuery = PageParams & {
  search?: string;
  status?: Member['status'];
  riskLevel?: Member['risk_level'];
};

export async function fetchMembersPage(
  query: MemberListQuery = {},
): Promise<PaginatedResult<MemberListRow>> {
  const supabase = requireSupabase();
  const page = query.page ?? 0;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const { from, to } = pageRange(page, pageSize);

  let request = supabase
    .from('members')
    .select(MEMBER_LIST_COLUMNS)
    .order('full_name')
    .range(from, to);

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`;
    request = request.or(`full_name.ilike.${pattern},phone.ilike.${pattern}`);
  }
  if (query.status) request = request.eq('status', query.status);
  if (query.riskLevel) request = request.eq('risk_level', query.riskLevel);

  const { data, error } = await request;
  if (error) throw fromSupabaseError(error, 'Unable to load members.');

  const items = (data ?? []) as MemberListRow[];
  return {
    items,
    page,
    pageSize,
    hasMore: hasMorePages(items.length, pageSize),
  };
}

export async function fetchMemberById(id: string): Promise<Member | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('members')
    .select(MEMBER_DETAIL_COLUMNS)
    .eq('id', id)
    .maybeSingle();
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
  const assignedTo = requireAssigneeId(input.assigned_to, 'member');
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('members')
    .insert({
      organization_id: await getCurrentOrganizationId(),
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      risk_level: input.risk_level ?? 'low',
      status: input.status ?? 'new',
      notes: input.notes?.trim() || null,
      assigned_to: assignedTo,
    })
    .select(MEMBER_DETAIL_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to create member.');
  return data as Member;
}

export async function updateMember(id: string, input: Partial<MemberInput>): Promise<Member> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.full_name !== undefined) patch.full_name = input.full_name.trim();
  if (input.phone !== undefined) patch.phone = input.phone?.trim() || null;
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.address !== undefined) patch.address = input.address?.trim() || null;
  if (input.risk_level !== undefined) patch.risk_level = input.risk_level;
  if (input.status !== undefined) patch.status = input.status;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.assigned_to !== undefined) {
    patch.assigned_to = requireAssigneeId(input.assigned_to, 'member');
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('members')
    .update(patch)
    .eq('id', id)
    .select(MEMBER_DETAIL_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, 'Unable to update member.');
  return data as Member;
}

export async function deleteMember(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw fromSupabaseError(error, 'Unable to delete member.');
}
