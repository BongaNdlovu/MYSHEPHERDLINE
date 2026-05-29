import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePendingAccessRequests } from '@/features/account/hooks/useAccessRequests';
import { markAccessRequestReviewed } from '@/features/account/services/profile-preferences.service';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { NoticeCard } from '@/components/ui/NoticeCard';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { inviteAccessRequest } from '@/lib/core/api';
import { useAuth } from '@/lib/core/auth';
import { getAppEnv } from '@/lib/core/env';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import type { AccessRequestDetail } from '@/features/account/services/profile-preferences.service';

export default function AdminAccessRequestsScreen() {
  const { session } = useAuth();
  const { data: requests, loading, error, refresh } = usePendingAccessRequests();
  const { showToast } = useToast();
  const [actingId, setActingId] = useState<string | null>(null);
  const workerConfigured = Boolean(getAppEnv().workerApiUrl);

  const sendInvite = async (request: AccessRequestDetail) => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      showToast('Sign in again to send invitations.');
      return;
    }
    if (!workerConfigured) {
      showToast('Worker API is not configured. Set EXPO_PUBLIC_WORKER_API_URL.');
      return;
    }
    if (!request.preferred_organization_id) {
      showToast('This request is missing a congregation selection.');
      return;
    }

    if (actingId) return;
    setActingId(request.id);
    try {
      const result = await inviteAccessRequest(accessToken, request.id);
      if (!result.ok) {
        const message =
          result.reason === 'conflict'
            ? 'Unable to send invitation for this request.'
            : result.reason === 'unconfigured'
              ? 'Worker API is not configured.'
              : result.reason === 'forbidden'
                ? 'Only admins can send invitations.'
                : 'Unable to send invitation. Try again.';
        showToast(message);
        return;
      }

      showToast(`Invitation sent to ${result.email || request.email}.`);
      await refresh();
    } catch (err) {
      showToast(getUserMessage(toAppError(err, 'Unable to send invitation.')));
    } finally {
      setActingId(null);
    }
  };

  const markReviewed = async (request: AccessRequestDetail) => {
    if (actingId) return;
    setActingId(request.id);
    try {
      await markAccessRequestReviewed(request.id);
      showToast('Marked reviewed.');
      await refresh();
    } catch (err) {
      showToast(getUserMessage(toAppError(err, 'Unable to update access request.')));
    } finally {
      setActingId(null);
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
        subtitle="Review and invite new shepherds"
      />
      <Text style={styles.intro}>
        Approve a request to email an invitation link. The shepherd sets their password from the email, then signs in
        here. Use “Mark reviewed” only if you handled the account outside the app.
      </Text>
      {!workerConfigured ? (
        <View style={styles.noticeWrap}>
          <NoticeCard
            tone="warning"
            message="Worker API is not configured. Set EXPO_PUBLIC_WORKER_API_URL before sending invitations."
          />
        </View>
      ) : null}
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
            style={[styles.button, actingId === request.id && styles.buttonDisabled]}
            testID={testIds.admin.accessRequests.invite(request.id)}
            disabled={actingId === request.id}
            onPress={() => void sendInvite(request)}
          >
            <Text style={styles.buttonText}>
              {actingId === request.id ? 'Sending…' : 'Approve & send invite'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.buttonSecondary, actingId === request.id && styles.buttonDisabled]}
            testID={testIds.admin.accessRequests.review(request.id)}
            disabled={actingId === request.id}
            onPress={() => void markReviewed(request)}
          >
            <Text style={styles.buttonSecondaryText}>Mark reviewed (no invite)</Text>
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
  noticeWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
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
  buttonSecondary: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.white, fontWeight: '700' },
  buttonSecondaryText: { color: colors.primary, fontWeight: '600' },
});
