import { describe, expect, it } from 'vitest';

import { filterMembers, membersNeedingAttention } from '@/features/members/selectors/members';
import type { Member } from '@/types/database';

const orgId = 'a0000000-0000-4000-8000-000000000001';
const now = '2026-05-26T10:00:00.000Z';

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: '1',
    organization_id: orgId,
    full_name: 'Sarah Mkhize',
    phone: '+27 82 123 4567',
    email: null,
    address: null,
    risk_level: 'high',
    status: 'inactive',
    care_stage: 'needs_urgent_care',
    last_contact_at: now,
    notes: null,
    assigned_to: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

const members: Member[] = [
  member(),
  member({
    id: '2',
    full_name: 'Sipho Dlamini',
    phone: '+27 84 345 6789',
    risk_level: 'medium',
    status: 'new',
    care_stage: 'new',
    last_contact_at: null,
    assigned_to: 'user-1',
  }),
];

describe('members domain', () => {
  it('filters by risk', () => {
    const result = filterMembers(members, '', 'urgent');
    expect(result).toHaveLength(1);
    expect(result[0]?.full_name).toBe('Sarah Mkhize');
  });

  it('filters by search query', () => {
    const result = filterMembers(members, 'sipho', 'all');
    expect(result).toHaveLength(1);
  });

  it('finds members needing attention', () => {
    const result = membersNeedingAttention(members);
    expect(result.length).toBeGreaterThan(0);
  });
});
