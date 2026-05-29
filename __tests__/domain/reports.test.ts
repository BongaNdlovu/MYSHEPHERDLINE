import { describe, expect, it } from 'vitest';

import {
  buildRecentReportSummary,
  buildReportSummary,
  resolveReportFailure,
} from '@/features/reports/selectors/reports';
import type { Member, Task, Visit } from '@/types/database';

const orgId = 'a0000000-0000-4000-8000-000000000001';
const now = '2026-05-26T10:00:00.000Z';

const fixtureMembers: Member[] = [
  {
    id: '1',
    organization_id: orgId,
    full_name: 'Sarah Mkhize',
    phone: null,
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
  },
  {
    id: '2',
    organization_id: orgId,
    full_name: 'Sipho Dlamini',
    phone: null,
    email: null,
    address: null,
    risk_level: 'medium',
    status: 'new',
    care_stage: 'new',
    last_contact_at: null,
    notes: null,
    assigned_to: 'user-1',
    created_at: now,
    updated_at: now,
  },
];

const fixtureTasks: Task[] = [
  {
    id: 't1',
    organization_id: orgId,
    title: 'Call member',
    description: null,
    assignee_id: 'user-1',
    member_id: '1',
    due_date: '2026-05-26',
    due_at: '2026-05-26T09:00:00.000Z',
    reminder_sent_at: null,
    reminder_minutes_before: 60,
    status: 'open',
    priority: 'high',
    task_type: 'call',
    created_at: now,
    updated_at: now,
  },
  {
    id: 't2',
    organization_id: orgId,
    title: 'Visit family',
    description: null,
    assignee_id: null,
    member_id: null,
    due_date: '2026-05-28',
    due_at: '2026-05-28T09:00:00.000Z',
    reminder_sent_at: null,
    reminder_minutes_before: 60,
    status: 'open',
    priority: 'medium',
    task_type: 'visit',
    created_at: now,
    updated_at: now,
  },
];

const fixtureVisits: Visit[] = [
  {
    id: 'v1',
    organization_id: orgId,
    member_id: '1',
    logged_by: 'user-1',
    visit_type: 'call',
    notes: null,
    follow_up_required: false,
    visited_at: now,
    created_at: now,
  },
  {
    id: 'v2',
    organization_id: orgId,
    member_id: '2',
    logged_by: 'user-1',
    visit_type: 'visit',
    notes: null,
    follow_up_required: false,
    visited_at: now,
    created_at: now,
  },
];

describe('reports domain', () => {
  it('derives new converts from recent member status, not visit type', () => {
    const summary = buildReportSummary({
      members: fixtureMembers,
      visits: fixtureVisits,
      tasks: fixtureTasks,
      recentActivityDays: 7,
    });

    expect(summary.visitBreakdown.newConverts).toBe(1);
    expect(summary.visitBreakdown.calls).toBe(1);
    expect(summary.visitBreakdown.visits).toBe(1);
    expect(summary.tasksOpen).toBe(2);
  });

  it('excludes older new-status members outside the recent window', () => {
    const summary = buildReportSummary({
      members: [
        ...fixtureMembers,
        {
          ...fixtureMembers[1],
          id: '3',
          full_name: 'Old Convert',
          created_at: '2020-01-01T00:00:00.000Z',
        },
      ],
      visits: fixtureVisits,
      tasks: fixtureTasks,
      recentActivityDays: 7,
    });

    expect(summary.visitBreakdown.newConverts).toBe(1);
  });

  it('builds summaries from compact fallback inputs', () => {
    const summary = buildRecentReportSummary({
      membersNeedingAttention: 3,
      recentVisits: fixtureVisits.map((visit) => ({
        visit_type: visit.visit_type,
        visited_at: visit.visited_at,
      })),
      tasksOpen: 7,
      newConverts: 2,
      recentActivityDays: 14,
    });

    expect(summary.membersNeedingAttention).toBe(3);
    expect(summary.visitsCompleted).toBe(2);
    expect(summary.tasksOpen).toBe(7);
    expect(summary.visitBreakdown.newConverts).toBe(2);
    expect(summary.recentActivityDays).toBe(14);
  });

  it('does not allow auth failures to fall back to local report aggregation', () => {
    const result = resolveReportFailure({ ok: false, reason: 'auth' }, true);

    expect(result.shouldUseFallback).toBe(false);
    expect(result.workerUnavailable).toBe(false);
    expect(result.error?.category).toBe('auth');
  });

  it('allows network failures to fall back and mark the worker as unavailable', () => {
    const result = resolveReportFailure({ ok: false, reason: 'network' }, true);

    expect(result.shouldUseFallback).toBe(true);
    expect(result.workerUnavailable).toBe(true);
    expect(result.error).toBeNull();
  });
});
