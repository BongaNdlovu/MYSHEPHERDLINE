import type { Member, Task, Visit } from '@/types/database';

const now = '2026-05-26T10:00:00.000Z';
const orgId = 'a0000000-0000-4000-8000-000000000001';

export const fixtureMembers: Member[] = [
  {
    id: '1',
    organization_id: orgId,
    full_name: 'Sarah Mkhize',
    phone: '+27 82 123 4567',
    email: 'sarah@example.com',
    address: 'Durban',
    risk_level: 'high',
    status: 'inactive',
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
    phone: '+27 84 345 6789',
    email: null,
    address: null,
    risk_level: 'medium',
    status: 'new',
    last_contact_at: now,
    notes: null,
    assigned_to: 'user-1',
    created_at: now,
    updated_at: now,
  },
];

export const fixtureTasks: Task[] = [
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

export const fixtureVisits: Visit[] = [
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
