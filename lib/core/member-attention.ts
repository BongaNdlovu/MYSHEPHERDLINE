import type { Member } from '@/types/database';

type AttentionMember = { risk_level: Member['risk_level']; status: Member['status'] };

/** PostgREST `.or()` filter matching `membersNeedingAttention`. */
export const MEMBERS_NEEDING_ATTENTION_OR_FILTER =
  'risk_level.eq.high,status.eq.inactive,status.eq.new';

export function memberNeedsAttention(member: AttentionMember): boolean {
  return (
    member.risk_level === 'high' || member.status === 'inactive' || member.status === 'new'
  );
}

export function membersNeedingAttention<T extends AttentionMember>(members: T[]): T[] {
  return members.filter(memberNeedsAttention);
}
