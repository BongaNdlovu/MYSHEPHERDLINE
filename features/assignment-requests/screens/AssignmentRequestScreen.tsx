import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { NoticeCard } from '@/components/ui/NoticeCard';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { createAssignmentRequest } from '@/features/assignment-requests';
import { useMember } from '@/features/members';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

const exampleReasons = [
  'Member moved to another area; need reassignment',
  'Need co-shepherd support for visits',
  'Member requested a different shepherd',
] as const;

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
    <View style={styles.screen} testID={testIds.assignmentRequest.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppHeader
          title="Request Assignment Change"
          subtitle={member?.full_name ?? 'Member'}
        />
        <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />

        {member ? (
          <>
            <View style={styles.noticeWrap}>
              <NoticeCard
                tone="info"
                title="How this works"
                message="Describe why this member should be reassigned or needs admin help. An administrator will review and approve or reject your request."
              />
            </View>
            <InlineError message={submitError} />
            <FormField
              label="Reason"
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder="e.g. Member moved to another area; need co-shepherd support"
              fieldTestId={testIds.assignmentRequest.reason}
            />
            <Text style={styles.examplesLabel}>Examples (tap to use)</Text>
            <View style={styles.examples}>
              {exampleReasons.map((example) => (
                <Pressable
                  key={example}
                  style={styles.exampleChip}
                  onPress={() => setReason(example)}
                >
                  <Text style={styles.exampleChipText}>{example}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
      {member ? (
        <StickyActionBar
          label="Submit request"
          loadingLabel="Submitting…"
          loading={saving}
          disabled={saving}
          testID={testIds.assignmentRequest.submit}
          onPress={() => void submit()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl + 72 },
  noticeWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  examplesLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  examples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  exampleChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exampleChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', lineHeight: 17 },
});
