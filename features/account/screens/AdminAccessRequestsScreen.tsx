import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePendingAccessRequests } from '@/features/account/hooks/useAccessRequests';
import { markAccessRequestReviewed } from '@/features/account/services/profile-preferences.service';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import type { AccessRequestDetail } from '@/features/account/services/profile-preferences.service';

export default function AdminAccessRequestsScreen() {
  const { data: requests, loading, error, refresh } = usePendingAccessRequests();
  const { showToast } = useToast();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const markReviewed = async (request: AccessRequestDetail) => {
    if (reviewingId) return;
    setReviewingId(request.id);
    try {
      await markAccessRequestReviewed(request.id);
      showToast('Marked reviewed. Provision the user in Supabase Auth when ready.');
      await refresh();
    } catch (err) {
      showToast(getUserMessage(toAppError(err, 'Unable to update access request.')));
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID={testIds.admin.accessRequests.screen}
    >
      <AppHeader
        title="Access Requests"
        subtitle="People requesting shepherd accounts"
      />
      <Text style={styles.intro}>
        Review each request, then create the user in Supabase Auth and assign their congregation in
        Users & Roles. Mark reviewed when handled.
      </Text>
      <QueryStateView
        loading={loading}
        error={error}
        onRetry={() => void refresh()}
        isEmpty={!loading && !error && !requests.length}
        emptyMessage="No pending access requests."
      />
      {requests.map((request) => (
        <Card key={request.id} title={request.display_name}>
          <InfoRow label="Email" value={request.email} />
          <InfoRow
            label="District"
            value={request.districtName ?? 'Not specified'}
          />
          <InfoRow
            label="Conference / Congregation"
            value={request.organizationName ?? 'Not specified'}
          />
          {request.message?.trim() ? (
            <InfoRow label="Message" value={request.message.trim()} />
          ) : null}
          <Text style={styles.meta}>
            Submitted {new Date(request.created_at).toLocaleString()}
          </Text>
          <Pressable
            style={[styles.button, reviewingId === request.id && styles.buttonDisabled]}
            testID={testIds.admin.accessRequests.review(request.id)}
            disabled={reviewingId === request.id}
            onPress={() => void markReviewed(request)}
          >
            <Text style={styles.buttonText}>
              {reviewingId === request.id ? 'Updating…' : 'Mark as reviewed'}
            </Text>
          </Pressable>
        </Card>
      ))}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl },
  intro: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  value: { color: colors.primary, fontSize: 15, fontWeight: '600', marginTop: 4 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.white, fontWeight: '700' },
});
