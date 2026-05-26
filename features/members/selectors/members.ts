import type { Member, MemberListRow } from '@/types/database';

export type MemberFilter = 'all' | 'risk' | 'inactive' | 'new';

type MemberLike = Member | MemberListRow;

export function filterMembers(members: MemberLike[], query: string, filter: MemberFilter) {
  const lower = query.trim().toLowerCase();
  return members.filter((member) => {
    const matchesQuery =
      !lower ||
      member.full_name.toLowerCase().includes(lower) ||
      (member.phone ?? '').toLowerCase().includes(lower);
    if (!matchesQuery) return false;

    if (filter === 'all') return true;
    if (filter === 'risk') return member.risk_level === 'high';
    if (filter === 'inactive') return member.status === 'inactive';
    if (filter === 'new') return member.status === 'new';
    return true;
  });
}

type AttentionMember = { risk_level: Member['risk_level']; status: Member['status'] };

export function membersNeedingAttention<T extends AttentionMember>(members: T[]): T[] {
  return members.filter(
    (member) =>
      member.risk_level === 'high' || member.status === 'inactive' || member.status === 'new',
  );
}
