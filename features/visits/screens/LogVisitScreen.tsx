import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useMember } from '@/features/members';
import { createVisit } from '@/features/visits';
import { useAuth } from '@/lib/core/auth';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { validateVisitLog } from '@/lib/core/validation';
import { useToast } from '@/lib/core/toast';
import type { VisitType } from '@/types/database';

const contactTypes: { label: string; value: VisitType }[] = [
  { label: 'Visit', value: 'visit' },
  { label: 'Call', value: 'call' },
  { label: 'Bible Study', value: 'bible_study' },
  { label: 'Other', value: 'other' },
];

export default function LogVisitScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { data: member, loading, error, refresh } = useMember(memberId);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [visitType, setVisitType] = useState<VisitType>('visit');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const backTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (backTimeoutRef.current) clearTimeout(backTimeoutRef.current);
    };
  }, []);

  const canSave = Boolean(member && user) && !saving;

  const onSave = async () => {
    const activeMember = member;
    const activeUser = user;
    const guardMessage = validateVisitLog({
      memberPresent: Boolean(activeMember),
      userPresent: Boolean(activeUser),
    });
    if (guardMessage) {
      setSubmitError(guardMessage);
      return;
    }

    setSubmitError(null);
    setSaving(true);
    try {
      await createVisit({
        memberId: activeMember!.id,
        userId: activeUser!.id,
        visitType,
        notes,
        followUpRequired: followUp,
      });
      showToast('Visit saved successfully.');
      backTimeoutRef.current = setTimeout(() => router.back(), 800);
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to save visit.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.logVisit.screen}>
      <AppHeader title="Log Visit" subtitle={member?.full_name ?? 'Member'} />

      <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />

      {member ? (
        <>
          <InlineError message={submitError} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact type</Text>
            <View style={styles.typeRow}>
              {contactTypes.map((type) => {
                const active = visitType === type.value;
                return (
                  <Pressable
                    key={type.value}
                    testID={testIds.logVisit.type(type.value)}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setVisitType(type.value)}
                  >
                    <Text style={[styles.typeText, active && styles.typeTextActive]}>{type.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              testID={testIds.logVisit.notes}
              value={notes}
              onChangeText={setNotes}
              placeholder="What was discussed or observed?"
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.notesInput}
            />
          </View>

          <Pressable style={styles.followUpRow} onPress={() => setFollowUp((value) => !value)}>
            <View style={[styles.checkbox, followUp && styles.checkboxActive]}>
              {followUp ? <Feather name="check" size={12} color={colors.white} /> : null}
            </View>
            <Text style={styles.followUpText}>Follow-up required</Text>
          </Pressable>

          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            testID={testIds.logVisit.save}
            onPress={onSave}
            disabled={!canSave}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Visit'}</Text>
          </Pressable>
          {!canSave && !saving ? (
            <Text style={styles.helper}>Sign in and select a valid member before saving.</Text>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.sm },
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
  typeText: { color: colors.textSecondary, fontWeight: '600' },
  typeTextActive: { color: colors.white },
  notesInput: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    textAlignVertical: 'top',
    color: colors.text,
  },
  followUpRow: {
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
  followUpText: { color: colors.primary, fontWeight: '600' },
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
  helper: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    fontSize: 13,
  },
});
