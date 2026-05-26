import { describe, expect, it } from 'vitest';

import { listAssignableShepherds, requireAssigneeId } from '@/features/admin/selectors/assignees';
import { AppException, isAppError } from '@/lib/core/errors';
import type { Profile } from '@/types/database';

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '1',
    organization_id: 'a0000000-0000-4000-8000-000000000001',
    email: 'user@example.com',
    display_name: 'User',
    role: 'shepherd',
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('listAssignableShepherds', () => {
  it('returns only active shepherds', () => {
    const result = listAssignableShepherds([
      profile({ id: 's1', role: 'shepherd' }),
      profile({ id: 'a1', role: 'admin' }),
      profile({ id: 'o1', role: 'owner' }),
      profile({ id: 's2', role: 'shepherd', is_active: false }),
    ]);

    expect(result.map((p) => p.id)).toEqual(['s1']);
  });
});

describe('requireAssigneeId', () => {
  it('returns trimmed assignee id', () => {
    expect(requireAssigneeId('  abc  ', 'member')).toBe('abc');
  });

  it('rejects missing member assignment', () => {
    try {
      requireAssigneeId(null, 'member');
      expect.fail('expected validation error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppException);
      expect(isAppError((error as AppException).appError)).toBe(true);
      expect((error as Error).message).toMatch(/Assign a shepherd/);
    }
  });

  it('rejects missing task assignment', () => {
    try {
      requireAssigneeId('', 'task');
      expect.fail('expected validation error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppException);
      expect(isAppError((error as AppException).appError)).toBe(true);
      expect((error as Error).message).toMatch(/Assign a shepherd/);
    }
  });
});
