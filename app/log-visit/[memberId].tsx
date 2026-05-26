import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { createVisit, useMember } from '@/lib/data';
import { useToast } from '@/lib/toast';
import type { VisitType } from '@/types/database';

const contactTypes: { label: string; value: VisitType }[] = [
  { label: 'Visit', value: 'visit' },
  { label: 'Call', value: 'call' },
  { label: 'Bible Study', value: 'bible_study' },
  { label: 'Other', value: 'other' },
];

export default function LogVisitScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { member } = useMember(memberId);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [visitType, setVisitType] = useState<VisitType>('visit');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!member || !user) {
      showToast('Sign in to log visits');
      return;
    }
    setSaving(true);
    const error = await createVisit({
      memberId: member.id,
      userId: user.id,
      visitType,
      notes,
      followUpRequired: followUp,
    });
    setSaving(false);
    if (error) {
      showToast(error);
      return;
    }
    showToast('Visit saved successfully!');
    setTimeout(() => router.back(), 800);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppHeader
        title="Log Visit"
        subtitle={member?.full_name ?? 'Member'}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact type</Text>
        <View style={styles.typeRow}>
          {contactTypes.map((type) => {
            const active = visitType === type.value;
            return (
              <Pressable
                key={type.value}
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
          {followUp ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={styles.followUpText}>Follow-up required</Text>
      </Pressable>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Visit'}</Text>
      </Pressable>
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
  checkMark: { color: colors.white, fontWeight: '700', fontSize: 12 },
  followUpText: { color: colors.primary, fontWeight: '600' },
  saveButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
