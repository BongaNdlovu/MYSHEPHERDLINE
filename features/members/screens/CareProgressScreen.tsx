import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { FormField } from '@/components/ui/FormField';
import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { ChoiceChipGroup } from '@/features/admin/components/ChoiceChipGroup';
import { updateCareProgress, useMember } from '@/features/members';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import type { Member, MemberStatus, RiskLevel } from '@/types/database';

const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];
const statuses: MemberStatus[] = ['new', 'active', 'inactive'];

function CareProgressForm({ member }: { member: Member }) {
  const { showToast } = useToast();
  const [riskLevel, setRiskLevel] = useState(member.risk_level);
  const [status, setStatus] = useState(member.status);
  const [notes, setNotes] = useState(member.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await updateCareProgress(member.id, { risk_level: riskLevel, status, notes });
      showToast('Care progress updated.');
      router.back();
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to update care progress.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <InlineError message={submitError} />
      <ChoiceChipGroup label="Risk level" options={riskLevels} value={riskLevel} onChange={setRiskLevel} />
      <ChoiceChipGroup label="Status" options={statuses} value={status} onChange={setStatus} />
      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline fieldTestId={testIds.careProgress.notes} />
      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        testID={testIds.careProgress.save}
        onPress={() => void save()}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save changes'}</Text>
      </Pressable>
    </>
  );
}

export default function CareProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, loading, error, refresh } = useMember(id);

  useAndroidBackNavigation();

  return (
    <FormScreen style={styles.screen} contentContainerStyle={styles.content} testID={testIds.careProgress.screen}>
      <AppHeader title="Update Care Progress" subtitle={member?.full_name ?? 'Member'} />
      <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />

      {member ? <CareProgressForm key={member.id} member={member} /> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  saveButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.55 },
  saveButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
