import type { Member, MemberListRow } from '@/types/database';

export function buildAttentionPreview(members: (Member | MemberListRow)[], limit = 4) {
  return members.slice(0, limit);
}

export function countAttentionMatches(members: (Member | MemberListRow)[]) {
  return members.length;
}
