import { filterMembers, membersNeedingAttention } from '@/features/members/selectors/members';
import type { Member, MemberListRow } from '@/types/database';

export function buildAttentionPreview(members: (Member | MemberListRow)[], query: string, limit = 4) {
  return filterMembers(membersNeedingAttention(members), query, 'all').slice(0, limit);
}
