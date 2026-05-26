export type UserRole = 'shepherd' | 'admin' | 'owner';

export type RiskLevel = 'high' | 'medium' | 'low';

export type MemberStatus = 'active' | 'inactive' | 'new';

export type TaskStatus = 'open' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high';

export type VisitType = 'visit' | 'call' | 'bible_study' | 'other';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
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

export interface Visit {
  id: string;
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
  title: string;
  description: string | null;
  assignee_id: string | null;
  member_id: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  device_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportSummary {
  membersNeedingAttention: number;
  visitsCompleted: number;
  tasksOpen: number;
  recentActivityDays: number;
  visitBreakdown: {
    visits: number;
    calls: number;
    bibleStudies: number;
    newConverts: number;
  };
}
