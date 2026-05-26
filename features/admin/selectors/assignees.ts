import { createAppError } from '@/lib/core/errors';
import type { Profile } from '@/types/database';

/** Active shepherds eligible for member/task assignment. */
export function listAssignableShepherds(profiles: Profile[]): Profile[] {
  return profiles.filter((profile) => profile.role === 'shepherd' && profile.is_active !== false);
}

export function requireAssigneeId(
  assigneeId: string | null | undefined,
  entityLabel: 'member' | 'task',
): string {
  const trimmed = assigneeId?.trim();
  if (!trimmed) {
    throw createAppError(
      'validation',
      entityLabel === 'member'
        ? 'Assign a shepherd before saving this member.'
        : 'Assign a shepherd before saving this task.',
    );
  }
  return trimmed;
}
