import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { FormField } from '@/components/ui/FormField';
import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { MemberListItem, useMember, useMembers } from '@/features/members';
import { createCareAction } from '@/features/visits';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { useAuth } from '@/lib/core/auth';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { validateDueDate, validateDueAt, validateVisitLog } from '@/lib/core/validation';
import { useToast } from '@/lib/core/toast';
import type { CareStage, MemberStatus, RiskLevel, TaskPriority, VisitType } from '@/types/database';

const actionTypes: { label: string; value: VisitType }[] = [
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

const careStages: CareStage[] = [
  'new',
  'contacted',
  'visited',
  'bible_study',
  'baptism_interest',
  'integrated',
  'inactive',
  'needs_urgent_care',
];

const statuses: MemberStatus[] = ['new', 'active', 'inactive'];
const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];
const priorities: TaskPriority[] = ['low', 'medium', 'high'];
const followUpTypes = ['call', 'visit', 'whatsapp', 'bible_study', 'prayer', 'invite', 'check_in', 'other'] as const;

function suggestedCareStage(actionType: VisitType): CareStage | null {
  if (actionType === 'call' || actionType === 'whatsapp' || actionType === 'prayer') return 'contacted';
  if (actionType === 'visit' || actionType === 'home_visit' || actionType === 'pastoral_visit') return 'visited';
  if (actionType === 'bible_study') return 'bible_study';
  if (actionType === 'baptism_prep') return 'baptism_interest';
  return null;
}

function titleForFollowUp(type: string, personName: string) {
  const label = type.replace(/_/g, ' ');
  const sentence = label.charAt(0).toUpperCase() + label.slice(1);
  return `${sentence} ${personName}`;
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  testIdPrefix,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  testIdPrefix?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.typeRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              style={[styles.typeChip, active && styles.typeChipActive]}
              onPress={() => onChange(option)}
              testID={testIdPrefix ? `${testIdPrefix}-${option}` : undefined}
            >
              <Text style={[styles.typeText, active && styles.typeTextActive]}>
                {option.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function LogVisitScreen() {
  const { memberId } = useLocalSearchParams<{ memberId?: string }>();
  const { data: routeMember, loading: memberLoading, error: memberError, refresh: refreshMember } = useMember(memberId);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(memberId ?? null);
  const [visitType, setVisitType] = useState<VisitType>('visit');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [careChanged, setCareChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [followUpType, setFollowUpType] = useState<(typeof followUpTypes)[number]>('call');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<TaskPriority>('medium');
  const [memberNotesOverride, setMemberNotesOverride] = useState<string | null>(null);
  const [stageTouched, setStageTouched] = useState(false);
  const [statusOverride, setStatusOverride] = useState<MemberStatus | null>(null);
  const [riskLevelOverride, setRiskLevelOverride] = useState<RiskLevel | null>(null);
  const [careStageOverride, setCareStageOverride] = useState<CareStage | null>(null);
  const mountedRef = useRef(true);

  const peopleQuery = useMembers({ search: memberQuery || undefined });

  useAndroidBackNavigation();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selectedMember =
    routeMember && routeMember.id === selectedMemberId
      ? routeMember
      : peopleQuery.data.find((member) => member.id === selectedMemberId) ?? null;
  const selectedMemberNotes =
    routeMember && routeMember.id === selectedMemberId ? (routeMember.notes ?? '') : '';
  const status = statusOverride ?? selectedMember?.status ?? 'active';
  const riskLevel = riskLevelOverride ?? selectedMember?.risk_level ?? 'low';
  const memberNotes = memberNotesOverride ?? selectedMemberNotes;
  const careStage =
    careStageOverride ??
    (stageTouched ? null : suggestedCareStage(visitType)) ??
    selectedMember?.care_stage ??
    'new';
  const canSave = Boolean(selectedMember && user) && !saving && !saved;

  const onSelectMember = (id: string) => {
    setSelectedMemberId(id);
    setStatusOverride(null);
    setRiskLevelOverride(null);
    setCareStageOverride(null);
    setMemberNotesOverride(null);
    setStageTouched(false);
  };

  const onSave = async () => {
    if (!canSave || !selectedMember) return;

    const guardMessage = validateVisitLog({
      memberPresent: Boolean(selectedMember),
      userPresent: Boolean(user),
    });
    if (guardMessage) {
      setSubmitError(guardMessage);
      return;
    }

    const dueDateError = followUp ? validateDueDate(followUpDate) : undefined;
    const dueAtValue = followUpDate && followUpTime ? `${followUpDate}T${followUpTime}:00.000Z` : '';
    const dueAtError = followUp && dueAtValue ? validateDueAt(dueAtValue) : undefined;

    if (dueDateError || dueAtError) {
      setSubmitError(dueDateError ?? dueAtError ?? 'Review the follow-up details.');
      return;
    }

    setSubmitError(null);
    setSaving(true);

    try {
      await createCareAction({
        memberId: selectedMember.id,
        visitType,
        notes,
        followUpRequired: followUp,
        status: careChanged ? status : undefined,
        riskLevel: careChanged ? riskLevel : undefined,
        careStage: careChanged ? careStage : undefined,
        memberNotes: careChanged ? memberNotes : undefined,
        followUpTitle: followUp ? titleForFollowUp(followUpType, selectedMember.full_name) : undefined,
        followUpDescription: followUp ? notes : undefined,
        followUpDueDate: followUp ? followUpDate || null : null,
        followUpDueAt: followUp ? dueAtValue || null : null,
        followUpPriority: followUp ? followUpPriority : undefined,
        followUpTaskType: followUp ? followUpType : undefined,
      });

      setSaved(true);
      showToast('Care action saved successfully.');
      if (mountedRef.current) router.back();
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to save care action.')));
      setSaving(false);
    }
  };

  const actionSubtitle = selectedMember ? selectedMember.full_name : 'Choose who you cared for today';

  return (
    <FormScreen style={styles.screen} contentContainerStyle={styles.content} testID={testIds.logVisit.screen}>
      <AppHeader title="Log Care Action" subtitle={actionSubtitle} />

      {memberId ? <QueryStateView loading={memberLoading} error={memberError} onRetry={() => void refreshMember()} /> : null}

      <InlineError message={submitError} />

      {!selectedMemberId ? (
        <View style={styles.section}>
          <FormField
            label="Select person"
            value={memberQuery}
            onChangeText={setMemberQuery}
            placeholder="Search people in care..."
            fieldTestId={testIds.logVisit.memberSearch}
          />
          <QueryStateView
            loading={peopleQuery.loading}
            error={peopleQuery.error}
            isEmpty={!peopleQuery.loading && !peopleQuery.error && !peopleQuery.data.length}
            emptyMessage="No people match that search."
            onRetry={() => void peopleQuery.refresh()}
          />
          {!peopleQuery.loading && !peopleQuery.error
            ? peopleQuery.data.slice(0, 8).map((member) => (
                <MemberListItem
                  key={member.id}
                  member={member}
                  onPress={() => onSelectMember(member.id)}
                  testID={testIds.people.member(member.id)}
                />
              ))
            : null}
        </View>
      ) : null}

      {selectedMember ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Action type</Text>
            <View style={styles.typeRow}>
              {actionTypes.map((type) => {
                const active = visitType === type.value;
                return (
                  <Pressable
                    key={type.value}
                    testID={testIds.logVisit.type(type.value)}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setVisitType(type.value)}
                    disabled={saved}
                  >
                    <Text style={[styles.typeText, active && styles.typeTextActive]}>{type.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <FormField
              label="Short note"
              value={notes}
              onChangeText={setNotes}
              placeholder="What happened?"
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!saved}
              fieldTestId={testIds.logVisit.notes}
              style={styles.notesInput}
            />
          </View>

          <Pressable style={styles.toggleRow} onPress={() => setCareChanged((value) => !value)} disabled={saved}>
            <View style={[styles.checkbox, careChanged && styles.checkboxActive]}>
              {careChanged ? <Feather name="check" size={12} color={colors.white} /> : null}
            </View>
            <Text style={styles.toggleText}>Did this person’s care status change?</Text>
          </Pressable>

          {careChanged ? (
            <>
              <ChoiceGroup
                label="Care stage"
                value={careStage}
                options={careStages}
                onChange={(value) => {
                  setStageTouched(true);
                  setCareStageOverride(value);
                }}
              />
              <ChoiceGroup label="Status" value={status} options={statuses} onChange={setStatusOverride} />
              <ChoiceGroup label="Risk level" value={riskLevel} options={riskLevels} onChange={setRiskLevelOverride} />
              <View style={styles.section}>
                <FormField
                  label="Care notes"
                  value={memberNotes}
                  onChangeText={setMemberNotesOverride}
                  placeholder="Update the person’s overall care notes if needed."
                  multiline
                  style={styles.notesInput}
                />
              </View>
            </>
          ) : null}

          <Pressable style={styles.toggleRow} onPress={() => setFollowUp((value) => !value)} disabled={saved}>
            <View style={[styles.checkbox, followUp && styles.checkboxActive]}>
              {followUp ? <Feather name="check" size={12} color={colors.white} /> : null}
            </View>
            <Text style={styles.toggleText}>Follow-up required</Text>
          </Pressable>

          {followUp ? (
            <>
              <ChoiceGroup
                label="Follow-up type"
                value={followUpType}
                options={followUpTypes}
                onChange={setFollowUpType}
              />
              <ChoiceGroup
                label="Priority"
                value={followUpPriority}
                options={priorities}
                onChange={setFollowUpPriority}
              />
              <View style={styles.section}>
                <FormField
                  label="Due date"
                  value={followUpDate}
                  onChangeText={setFollowUpDate}
                  placeholder="YYYY-MM-DD"
                />
                <FormField
                  label="Reminder time"
                  value={followUpTime}
                  onChangeText={setFollowUpTime}
                  placeholder="HH:mm"
                />
                <Text style={styles.helper}>
                  Follow-ups are assigned to you and will create a care task automatically.
                </Text>
              </View>
            </>
          ) : null}

          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            testID={testIds.logVisit.save}
            onPress={() => void onSave()}
            disabled={!canSave}
          >
            <Text style={styles.saveButtonText}>
              {saved ? 'Saved' : saving ? 'Saving...' : 'Save Care Action'}
            </Text>
          </Pressable>
        </>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'none' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { color: colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  typeTextActive: { color: colors.white },
  notesInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  toggleText: { color: colors.primary, fontWeight: '600', flex: 1 },
  helper: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  saveButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.55 },
  saveButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
