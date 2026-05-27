import { createAppError, fromSupabaseError } from '@/lib/core/errors';
import {
  DEFAULT_PAGE_SIZE,
  hasMorePages,
  pageRange,
  type PageParams,
  type PaginatedResult,
} from '@/lib/core/pagination';
import { requireSupabase } from '@/lib/core/supabase';
import type { Visit } from '@/types/database';

export const VISIT_LIST_COLUMNS =
  'id, organization_id, member_id, logged_by, visit_type, notes, follow_up_required, visited_at, created_at';

export type VisitListRow = Pick<
  Visit,
  | 'id'
  | 'organization_id'
  | 'member_id'
  | 'logged_by'
  | 'visit_type'
  | 'notes'
  | 'follow_up_required'
  | 'visited_at'
  | 'created_at'
>;

export async function createVisit(input: {
  memberId: string;
  userId: string;
  visitType: Visit['visit_type'];
  notes: string;
  followUpRequired: boolean;
}) {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc('log_visit', {
    p_member_id: input.memberId,
    p_visit_type: input.visitType,
    p_notes: input.notes,
    p_follow_up_required: input.followUpRequired,
  });

  if (error) {
    if (error.message.includes('Member not found')) {
      throw createAppError('not_found', 'Member not found.');
    }
    if (error.message.includes('Account deactivated')) {
      throw createAppError('auth', 'Your account is deactivated. Contact your administrator.');
    }
    throw fromSupabaseError(error, 'Unable to save visit.');
  }
}

export async function fetchVisitsForMemberPage(
  memberId: string,
  query: PageParams = {},
): Promise<PaginatedResult<VisitListRow>> {
  const supabase = requireSupabase();
  const page = query.page ?? 0;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const { from, to } = pageRange(page, pageSize);

  const { data, error } = await supabase
    .from('visits')
    .select(VISIT_LIST_COLUMNS)
    .eq('member_id', memberId)
    .order('visited_at', { ascending: false })
    .range(from, to);

  if (error) throw fromSupabaseError(error, 'Unable to load visit history.');

  const items = (data ?? []) as VisitListRow[];
  return {
    items,
    page,
    pageSize,
    hasMore: hasMorePages(items.length, pageSize),
  };
}
