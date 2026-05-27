import { describe, expect, it } from 'vitest';

import { filterMembers, membersNeedingAttention } from '@/features/members/selectors/members';
import { fixtureMembers } from '@/__tests__/fixtures/demo-data';

describe('members domain', () => {
  it('filters by risk', () => {
    const result = filterMembers(fixtureMembers, '', 'urgent');
    expect(result).toHaveLength(1);
    expect(result[0]?.full_name).toBe('Sarah Mkhize');
  });

  it('filters by search query', () => {
    const result = filterMembers(fixtureMembers, 'sipho', 'all');
    expect(result).toHaveLength(1);
  });

  it('finds members needing attention', () => {
    const result = membersNeedingAttention(fixtureMembers);
    expect(result.length).toBeGreaterThan(0);
  });
});
