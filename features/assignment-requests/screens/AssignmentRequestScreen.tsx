import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { FormField } from '@/components/ui/FormField';
import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { createAssignmentRequest } from '@/features/assignment-requests';
import { useMember } from '@/features/members';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

export default function AssignmentRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, loading, error, refresh } = useMember(id);
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useAndroidBackNavigation();

  const submit = async () => {
    if (!member || saving) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setSubmitError('Please describe why you need an assignment change.');
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await createAssignmentRequest({ memberId: member.id, reason: trimmed });
      showToast('Assignment request submitted. An admin will review it.');
      router.back();
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to submit request.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID={testIds.assignmentRequest.screen}
    >
      <AppHeader
        title="Request Assignment Change"
        subtitle={member?.full_name ?? 'Member'}
      />
      <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />

      {member ? (
        <>
          <Text style={styles.helper}>
            Describe why this member should be reassigned or needs admin help. An administrator will
            review and approve or reject your request.
          </Text>
          <InlineError message={submitError} />
          <FormField
            label="Reason"
            value={reason}
            onChangeText={setReason}
            multiline
            placeholder="e.g. Member moved to another area; need co-shepherd support"
            fieldTestId={testIds.assignmentRequest.reason}
          />
          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            testID={testIds.assignmentRequest.submit}
            onPress={() => void submit()}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Submitting…' : 'Submit request'}</Text>
          </Pressable>
        </>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  helper: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
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
