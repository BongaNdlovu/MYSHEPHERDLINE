import type { Member, MemberListRow } from '@/types/database';

export type MemberFilter =
  | 'all'
  | 'urgent'
  | 'new'
  | 'not_contacted'
  | 'inactive'
  | 'bible_study'
  | 'baptism_interest'
  | 'my_people';

type MemberLike = Member | MemberListRow;

export {
  memberNeedsAttention,
  membersNeedingAttention,
  MEMBERS_NEEDING_ATTENTION_OR_FILTER,
} from '@/lib/core/member-attention';

export function filterMembers(members: MemberLike[], query: string, filter: MemberFilter) {
  const lower = query.trim().toLowerCase();
  return members.filter((member) => {
    const matchesQuery =
      !lower ||
      member.full_name.toLowerCase().includes(lower) ||
      (member.phone ?? '').toLowerCase().includes(lower);
    if (!matchesQuery) return false;

    if (filter === 'all') return true;
    if (filter === 'urgent') return member.risk_level === 'high' || member.care_stage === 'needs_urgent_care';
    if (filter === 'new') return member.status === 'new' || member.care_stage === 'new';
    if (filter === 'not_contacted') return !member.last_contact_at;
    if (filter === 'inactive') return member.status === 'inactive' || member.care_stage === 'inactive';
    if (filter === 'bible_study') return member.care_stage === 'bible_study';
    if (filter === 'baptism_interest') return member.care_stage === 'baptism_interest';
    // Assignment scoping is enforced server-side (RLS + assignedTo query); pass through here.
    if (filter === 'my_people') return true;
    return true;
  });
}
