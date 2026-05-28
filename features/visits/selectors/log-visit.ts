import type { CareStage, MemberStatus, RiskLevel, TaskPriority, VisitType } from '@/types/database';

export const actionTypes: { label: string; value: VisitType }[] = [
  { label: 'Visit', value: 'visit' },
  { label: 'Call', value: 'call' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Bible Study', value: 'bible_study' },
  { label: 'Prayer', value: 'prayer' },
  { label: 'Pastoral Visit', value: 'pastoral_visit' },
  { label: 'Home Visit', value: 'home_visit' },
  { label: 'Baptism Prep', value: 'baptism_prep' },
  { label: 'Other', value: 'other' },
];

export const careStages: CareStage[] = [
  'new',
  'contacted',
  'visited',
  'bible_study',
  'baptism_interest',
  'integrated',
  'inactive',
  'needs_urgent_care',
];

export const statuses: MemberStatus[] = ['new', 'active', 'inactive'];
export const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];
export const priorities: TaskPriority[] = ['low', 'medium', 'high'];
export const followUpTypes = ['call', 'visit', 'whatsapp', 'bible_study', 'prayer', 'invite', 'check_in', 'other'] as const;

export function suggestedCareStage(actionType: VisitType): CareStage | null {
  if (actionType === 'call' || actionType === 'whatsapp' || actionType === 'prayer') return 'contacted';
  if (actionType === 'visit' || actionType === 'home_visit' || actionType === 'pastoral_visit') return 'visited';
  if (actionType === 'bible_study') return 'bible_study';
  if (actionType === 'baptism_prep') return 'baptism_interest';
  return null;
}

export function titleForFollowUp(type: string, personName: string) {
  const label = type.replace(/_/g, ' ');
  const sentence = label.charAt(0).toUpperCase() + label.slice(1);
  return `${sentence} ${personName}`;
}
