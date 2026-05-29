import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ToggleCard } from '@/components/ui/ToggleCard';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { MemberListItem, useMember, useMembers } from '@/features/members';
import { createCareAction } from '@/features/visits';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { useAuth } from '@/lib/core/auth';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { validateDueAt, validateDueDate, validateVisitLog } from '@/lib/core/validation';
import type { CareStage, MemberStatus, RiskLevel, TaskPriority, VisitType } from '@/types/database';

import { CareChangeSection } from '../components/CareChangeSection';
import { FollowUpSection } from '../components/FollowUpSection';
import {
  actionTypes,
  followUpTypes,
  suggestedCareStage,
  titleForFollowUp,
} from '../selectors/log-visit';

const actionIcons: Record<VisitType, ComponentProps<typeof Feather>['name']> = {
  visit: 'home',
  call: 'phone',
  whatsapp: 'message-circle',
  bible_study: 'book-open',
  prayer: 'heart',
  pastoral_visit: 'users',
  home_visit: 'map-pin',
  baptism_prep: 'droplet',
  other: 'more-horizontal',
};

export default function LogVisitScreen() {
  const { memberId } = useLocalSearchParams<{ memberId?: string }>();
  const {
    data: routeMember,
    loading: memberLoading,
    error: memberError,
    refresh: refreshMember,
  } = useMember(memberId);
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
  const stepOffset = selectedMemberId ? 0 : 1;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID={testIds.logVisit.screen}
      >
        <AppHeader title="Log Care Action" subtitle={actionSubtitle} />

        {memberId ? (
          <QueryStateView
            loading={memberLoading}
            error={memberError}
            onRetry={() => void refreshMember()}
          />
        ) : null}

        <InlineError message={submitError} />

        {!selectedMemberId ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Select person</Text>
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
              <Text style={styles.sectionTitle}>{stepOffset + 1}. Action type</Text>
              <View style={styles.typeGrid}>
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
                      <Feather
                        name={actionIcons[type.value]}
                        size={22}
                        color={active ? colors.white : colors.primary}
                      />
                      <Text style={[styles.typeText, active && styles.typeTextActive]}>{type.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{stepOffset + 2}. Short note</Text>
              <FormField
                label="Short note"
                value={notes}
                onChangeText={setNotes}
                placeholder="What happened?"
                multiline
                editable={!saved}
                fieldTestId={testIds.logVisit.notes}
                style={styles.notesInput}
              />
            </View>

            <ToggleCard
              title="Did this person's care status change?"
              enabled={careChanged}
              onToggle={() => setCareChanged((value) => !value)}
              disabled={saved}
            />

            {careChanged ? (
              <CareChangeSection
                careStage={careStage}
                onCareStageChange={(value) => {
                  setStageTouched(true);
                  setCareStageOverride(value);
                }}
                status={status}
                onStatusChange={setStatusOverride}
                riskLevel={riskLevel}
                onRiskLevelChange={setRiskLevelOverride}
                memberNotes={memberNotes}
                onMemberNotesChange={setMemberNotesOverride}
              />
            ) : null}

            <ToggleCard
              title="Follow-up required"
              enabled={followUp}
              onToggle={() => setFollowUp((value) => !value)}
              disabled={saved}
            />

            {followUp ? (
              <FollowUpSection
                followUpType={followUpType}
                onFollowUpTypeChange={setFollowUpType}
                followUpPriority={followUpPriority}
                onFollowUpPriorityChange={setFollowUpPriority}
                followUpDate={followUpDate}
                onFollowUpDateChange={setFollowUpDate}
                followUpTime={followUpTime}
                onFollowUpTimeChange={setFollowUpTime}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {selectedMember ? (
        <StickyActionBar
          label={saved ? 'Saved' : 'Save Care Action'}
          loadingLabel="Saving..."
          loading={saving}
          disabled={!canSave}
          testID={testIds.logVisit.save}
          onPress={() => void onSave()}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.lg },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: {
    color: colors.primary,
    fontWeight: '800',
    marginBottom: spacing.sm,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    width: '31%',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  typeTextActive: { color: colors.white },
});
