import { filterMembers } from '@/features/members/selectors/members';
import type { Member, MemberListRow } from '@/types/database';

export function buildAttentionPreview(members: (Member | MemberListRow)[], query: string, limit = 4) {
  return filterMembers(members, query, 'all').slice(0, limit);
}

export function countAttentionMatches(members: (Member | MemberListRow)[], query: string) {
  return filterMembers(members, query, 'all').length;
}
