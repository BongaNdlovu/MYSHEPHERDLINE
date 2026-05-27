export type UserRole = 'shepherd' | 'admin' | 'owner';

export type RiskLevel = 'high' | 'medium' | 'low';

export type MemberStatus = 'active' | 'inactive' | 'new';

export type TaskStatus = 'open' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high';

export type AssignmentRequestStatus = 'pending' | 'approved' | 'rejected';

export type VisitType = 'visit' | 'call' | 'bible_study' | 'other';

export interface District {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  district_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  preferred_district_id: string | null;
  preferred_organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessRequest {
  id: string;
  email: string;
  display_name: string;
  preferred_district_id: string | null;
  preferred_organization_id: string | null;
  message: string | null;
  status: 'pending' | 'reviewed';
  created_at: string;
}

export interface Member {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  risk_level: RiskLevel;
  status: MemberStatus;
  last_contact_at: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

/** List screen projection — smaller payload than full Member. */
export type MemberListRow = Pick<
  Member,
  | 'id'
  | 'organization_id'
  | 'full_name'
  | 'phone'
  | 'risk_level'
  | 'status'
  | 'last_contact_at'
  | 'assigned_to'
>;

export interface Visit {
  id: string;
  organization_id: string;
  member_id: string;
  logged_by: string;
  visit_type: VisitType;
  notes: string | null;
  follow_up_required: boolean;
  visited_at: string;
  created_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  member_id: string | null;
  due_date: string | null;
  due_at: string | null;
  reminder_sent_at: string | null;
  reminder_minutes_before: number;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRequest {
  id: string;
  organization_id: string;
  member_id: string | null;
  task_id: string | null;
  requested_by: string;
  reason: string;
  status: AssignmentRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** List screen projection — smaller payload than full Task. */
export type TaskListRow = Pick<
  Task,
  | 'id'
  | 'organization_id'
  | 'title'
  | 'due_date'
  | 'due_at'
  | 'status'
  | 'priority'
  | 'assignee_id'
  | 'member_id'
  | 'task_type'
>;

export interface PushToken {
  id: string;
  organization_id: string;
  user_id: string;
  expo_push_token: string;
  device_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type { ReportSummary } from '../shared/report-summary';
