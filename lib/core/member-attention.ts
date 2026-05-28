import type { Member, TaskListRow } from '@/types/database';

type AttentionMemberBase = Pick<Member, 'risk_level' | 'status' | 'care_stage' | 'last_contact_at' | 'created_at'>;

type AttentionMember = AttentionMemberBase &
  Partial<Pick<Member, 'id' | 'full_name' | 'phone'>>;

type AttentionTask = Pick<TaskListRow, 'id' | 'status' | 'due_date' | 'member_id' | 'task_type' | 'title'>;

export type AttentionReason =
  | 'follow_up_overdue'
  | 'needs_urgent_care'
  | 'high_risk_no_recent_contact'
  | 'inactive_no_recent_contact'
  | 'new_not_contacted'
  | 'follow_up_due_today'
  | 'not_contacted_recently'
  | 'recently_updated';

export type AttentionSection =
  | 'overdue'
  | 'urgent_care'
  | 'new_people'
  | 'follow_ups_due'
  | 'recently_updated';

export type MemberAttentionEntry<T extends AttentionMember = AttentionMember> = {
  member: T;
  reason: AttentionReason;
  reasonLabel: string;
  section: AttentionSection;
  overdueTaskCount: number;
  dueTodayTaskCount: number;
  lastContactDays: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const ATTENTION_THRESHOLDS = {
  newContactHours: 48,
  highRiskNoContactDays: 7,
  inactiveNoContactDays: 21,
  generalNoContactDays: 30,
  recentUpdateDays: 7,
} as const;

export const MEMBER_ATTENTION_SHORTLIST_FILTERS = [
  { column: 'risk_level', value: 'high' },
  { column: 'status', value: 'inactive' },
  { column: 'status', value: 'new' },
  { column: 'care_stage', value: 'needs_urgent_care' },
] as const;

/** PostgREST `.or()` filter matching the base member-only attention shortlist. */
export const MEMBERS_NEEDING_ATTENTION_OR_FILTER = MEMBER_ATTENTION_SHORTLIST_FILTERS
  .map(({ column, value }) => `${column}.eq.${value}`)
  .join(',');

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysSince(dateValue: string | null | undefined, reference: Date) {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((reference.getTime() - parsed.getTime()) / DAY_MS);
}

function hoursSince(dateValue: string | null | undefined, reference: Date) {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((reference.getTime() - parsed.getTime()) / (60 * 60 * 1000));
}

function getTaskCounts(memberId: string, tasks: AttentionTask[], todayKey: string) {
  let overdue = 0;
  let today = 0;

  for (const task of tasks) {
    if (task.status !== 'open' || task.member_id !== memberId || !task.due_date) continue;
    const dueKey = task.due_date.slice(0, 10);
    if (dueKey < todayKey) overdue += 1;
    else if (dueKey === todayKey) today += 1;
  }

  return { overdue, today };
}

function buildReason(
  member: AttentionMember,
  tasks: AttentionTask[],
  reference: Date,
): Omit<MemberAttentionEntry, 'member'> | null {
  const todayKey = toDateKey(reference);
  const lastContactDays = daysSince(member.last_contact_at, reference);
  const createdHours = hoursSince(member.created_at, reference);
  const memberId = member.id ?? '';
  const { overdue, today } = memberId ? getTaskCounts(memberId, tasks, todayKey) : { overdue: 0, today: 0 };

  if (overdue > 0) {
    return {
      reason: 'follow_up_overdue',
      reasonLabel: overdue === 1 ? 'Follow-up overdue' : `${overdue} follow-ups overdue`,
      section: 'overdue',
      overdueTaskCount: overdue,
      dueTodayTaskCount: today,
      lastContactDays,
    };
  }

  if (member.care_stage === 'needs_urgent_care') {
    return {
      reason: 'needs_urgent_care',
      reasonLabel: 'Urgent care needed',
      section: 'urgent_care',
      overdueTaskCount: overdue,
      dueTodayTaskCount: today,
      lastContactDays,
    };
  }

  if (
    member.risk_level === 'high' &&
    (lastContactDays === null || lastContactDays >= ATTENTION_THRESHOLDS.highRiskNoContactDays)
  ) {
    return {
      reason: 'high_risk_no_recent_contact',
      reasonLabel:
        lastContactDays === null
          ? 'High risk - no contact yet'
          : `High risk - no contact in ${lastContactDays} days`,
      section: 'urgent_care',
      overdueTaskCount: overdue,
      dueTodayTaskCount: today,
      lastContactDays,
    };
  }

  if (
    member.status === 'inactive' &&
    (lastContactDays === null || lastContactDays >= ATTENTION_THRESHOLDS.inactiveNoContactDays)
  ) {
    return {
      reason: 'inactive_no_recent_contact',
      reasonLabel:
        lastContactDays === null
          ? 'Inactive - no contact yet'
          : `Inactive - no contact in ${lastContactDays} days`,
      section: 'urgent_care',
      overdueTaskCount: overdue,
      dueTodayTaskCount: today,
      lastContactDays,
    };
  }

  if (
    member.status === 'new' &&
    !member.last_contact_at &&
    (createdHours === null || createdHours >= ATTENTION_THRESHOLDS.newContactHours)
  ) {
    return {
      reason: 'new_not_contacted',
      reasonLabel: 'New - not contacted yet',
      section: 'new_people',
      overdueTaskCount: overdue,
      dueTodayTaskCount: today,
      lastContactDays,
    };
  }

  if (today > 0) {
    return {
      reason: 'follow_up_due_today',
      reasonLabel: today === 1 ? 'Follow-up due today' : `${today} follow-ups due today`,
      section: 'follow_ups_due',
      overdueTaskCount: overdue,
      dueTodayTaskCount: today,
      lastContactDays,
    };
  }

  if (lastContactDays !== null && lastContactDays >= ATTENTION_THRESHOLDS.generalNoContactDays) {
    return {
      reason: 'not_contacted_recently',
      reasonLabel: `No contact in ${lastContactDays} days`,
      section: 'follow_ups_due',
      overdueTaskCount: overdue,
      dueTodayTaskCount: today,
      lastContactDays,
    };
  }

  if (lastContactDays !== null && lastContactDays <= ATTENTION_THRESHOLDS.recentUpdateDays) {
    return {
      reason: 'recently_updated',
      reasonLabel: 'Recently updated',
      section: 'recently_updated',
      overdueTaskCount: overdue,
      dueTodayTaskCount: today,
      lastContactDays,
    };
  }

  return null;
}

export function buildMemberAttentionList<T extends AttentionMember>(
  members: T[],
  tasks: AttentionTask[] = [],
  reference = new Date(),
): MemberAttentionEntry<T>[] {
  return members
    .map((member) => {
      const result = buildReason(member, tasks, reference);
      return result ? { member, ...result } : null;
    })
    .filter((entry): entry is MemberAttentionEntry<T> => Boolean(entry));
}

export function memberNeedsAttention(member: AttentionMember, tasks: AttentionTask[] = []): boolean {
  return buildReason(member, tasks, new Date()) !== null;
}

export function membersNeedingAttention<T extends AttentionMember>(members: T[]): T[] {
  return buildMemberAttentionList(members).map((entry) => entry.member);
}
