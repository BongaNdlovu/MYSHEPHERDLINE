import {
  buildMemberAttentionList,
  type MemberAttentionEntry,
} from '@/lib/core/member-attention';
import type { Member, MemberListRow, TaskListRow } from '@/types/database';

export function buildAttentionPreview(
  members: (Member | MemberListRow)[],
  tasksOrLimit: TaskListRow[] | number = [],
  maybeLimit = 4,
): MemberAttentionEntry[] {
  const tasks = Array.isArray(tasksOrLimit) ? tasksOrLimit : [];
  const limit = Array.isArray(tasksOrLimit) ? maybeLimit : tasksOrLimit;
  return buildMemberAttentionList(members, tasks).slice(0, limit);
}

export function countAttentionMatches(members: (Member | MemberListRow)[], tasks: TaskListRow[] = []) {
  return buildMemberAttentionList(members, tasks).length;
}
