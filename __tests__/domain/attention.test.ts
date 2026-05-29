import { describe, expect, it } from 'vitest';

import {
  MEMBER_ATTENTION_SHORTLIST_FILTERS,
  MEMBERS_NEEDING_ATTENTION_OR_FILTER,
  memberNeedsAttention,
  membersNeedingAttention,
} from '@/lib/core/member-attention';
import { buildAttentionPreview, countAttentionMatches } from '@/features/home/selectors/dashboard';
import { DEFAULT_PAGE_SIZE } from '@/lib/core/pagination';
import type { MemberListRow } from '@/types/database';

function memberRow(overrides: Partial<MemberListRow> = {}): MemberListRow {
  return {
    id: overrides.id ?? 'member-id',
    organization_id: 'a0000000-0000-4000-8000-000000000001',
    full_name: overrides.full_name ?? 'Member',
    phone: null,
    risk_level: overrides.risk_level ?? 'low',
    status: overrides.status ?? 'active',
    care_stage: overrides.care_stage ?? 'contacted',
    last_contact_at: null,
    assigned_to: 'shepherd-id',
    created_at: '2026-05-26T10:00:00.000Z',
    ...overrides,
  };
}

describe('members attention selectors', () => {
  it('matches the canonical PostgREST filter string', () => {
    expect(MEMBERS_NEEDING_ATTENTION_OR_FILTER).toBe(
      'risk_level.eq.high,status.eq.inactive,status.eq.new,care_stage.eq.needs_urgent_care',
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

  it('keeps the shortlist filter aligned with member-only attention reasons', () => {
    const shortlistCases: Record<string, MemberListRow> = {
      'risk_level:high': memberRow({ id: 'high-risk', risk_level: 'high' }),
      'status:inactive': memberRow({ id: 'inactive', status: 'inactive' }),
      'status:new': memberRow({
        id: 'new-member',
        status: 'new',
        created_at: '2026-05-20T10:00:00.000Z',
      }),
      'care_stage:needs_urgent_care': memberRow({
        id: 'urgent-care',
        care_stage: 'needs_urgent_care',
      }),
    };

    for (const filter of MEMBER_ATTENTION_SHORTLIST_FILTERS) {
      const key = `${filter.column}:${filter.value}`;
      expect(memberNeedsAttention(shortlistCases[key])).toBe(true);
    }
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

  it('works with members needing attention', () => {
    const attention = membersNeedingAttention([
      memberRow({ risk_level: 'high' }),
      memberRow({ id: 'regular', status: 'active', risk_level: 'low' }),
    ]);
    expect(attention.length).toBeGreaterThan(0);
    expect(countAttentionMatches(attention)).toBe(attention.length);
  });
});
