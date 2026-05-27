import { describe, expect, it } from 'vitest';

import {
  MEMBERS_NEEDING_ATTENTION_OR_FILTER,
  memberNeedsAttention,
  membersNeedingAttention,
} from '@/lib/core/member-attention';
import { buildAttentionPreview, countAttentionMatches } from '@/features/home/selectors/dashboard';
import { DEFAULT_PAGE_SIZE } from '@/lib/core/pagination';
import { fixtureMembers } from '@/__tests__/fixtures/demo-data';
import type { MemberListRow } from '@/types/database';

function memberRow(overrides: Partial<MemberListRow> = {}): MemberListRow {
  return {
    id: overrides.id ?? 'member-id',
    organization_id: 'a0000000-0000-4000-8000-000000000001',
    full_name: overrides.full_name ?? 'Member',
    phone: null,
    risk_level: overrides.risk_level ?? 'low',
    status: overrides.status ?? 'active',
    last_contact_at: null,
    assigned_to: 'shepherd-id',
    ...overrides,
  };
}

describe('members attention selectors', () => {
  it('matches the canonical PostgREST filter string', () => {
    expect(MEMBERS_NEEDING_ATTENTION_OR_FILTER).toBe(
      'risk_level.eq.high,status.eq.inactive,status.eq.new',
    );
  });

  it('identifies members needing attention consistently', () => {
    const attentionMember = memberRow({ id: 'attention', risk_level: 'high' });
    const regularMember = memberRow({ id: 'regular', status: 'active', risk_level: 'low' });

    expect(memberNeedsAttention(attentionMember)).toBe(true);
    expect(memberNeedsAttention(regularMember)).toBe(false);
    expect(membersNeedingAttention([attentionMember, regularMember]).map((member) => member.id)).toEqual([
      'attention',
    ]);
  });
});

describe('home attention preview', () => {
  it('counts attention members beyond the first page preview limit', () => {
    const attentionMembers = Array.from({ length: DEFAULT_PAGE_SIZE + 3 }, (_, index) =>
      memberRow({
        id: `attention-${index}`,
        full_name: `Attention ${index}`,
        risk_level: 'high',
      }),
    );

    expect(buildAttentionPreview(attentionMembers, 4)).toHaveLength(4);
    expect(countAttentionMatches(attentionMembers)).toBe(DEFAULT_PAGE_SIZE + 3);
  });

  it('works with fixture members needing attention', () => {
    const attention = membersNeedingAttention(fixtureMembers);
    expect(attention.length).toBeGreaterThan(0);
    expect(countAttentionMatches(fixtureMembers)).toBe(attention.length);
  });
});
