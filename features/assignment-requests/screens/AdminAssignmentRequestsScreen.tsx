import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { QueryStateView } from '@/components/ui/QueryStateView';
import {
  reviewAssignmentRequest,
  usePendingAssignmentRequests,
} from '@/features/assignment-requests';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import type { AssignmentRequestDetail } from '@/features/assignment-requests/services/assignment-requests.service';

function requestCardTitle(request: AssignmentRequestDetail): string {
  if (request.memberName?.trim()) return request.memberName.trim();
  if (request.member_id) return 'Member (name unavailable)';
  if (request.taskTitle?.trim()) return request.taskTitle.trim();
  return request.member_id ? 'Member request' : 'Task request';
}

function requestCardSubtitle(request: AssignmentRequestDetail): string | undefined {
  if (request.memberName?.trim() && request.taskTitle?.trim()) return `Task: ${request.taskTitle.trim()}`;
  if (request.member_id && !request.memberName?.trim()) return 'Assignment change for member';
  if (!request.member_id && request.taskTitle?.trim()) return 'Task assignment request';
  return undefined;
}

export default function AdminAssignmentRequestsScreen() {
  const { data: requests, loading, error, refresh } = usePendingAssignmentRequests();
  const { showToast } = useToast();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const review = async (request: AssignmentRequestDetail, status: 'approved' | 'rejected') => {
    if (reviewingId) return;
    setReviewingId(request.id);
    try {
      await reviewAssignmentRequest(request.id, status);
      showToast(status === 'approved' ? 'Request approved.' : 'Request rejected.');
      await refresh();
    } catch (err) {
      showToast(getUserMessage(toAppError(err, 'Unable to review request.')));
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID={testIds.admin.assignmentRequests.screen}
    >
      <AppHeader
        title="Assignment Requests"
        subtitle="Shepherd requests awaiting admin review"
      />
      <QueryStateView
        loading={loading}
        error={error}
        onRetry={() => void refresh()}
        isEmpty={!loading && !error && !requests.length}
        emptyMessage="No pending assignment requests."
      />
      {requests.map((request) => (
        <Card
          key={request.id}
          title={requestCardTitle(request)}
          subtitle={requestCardSubtitle(request)}
          badge="Pending"
          badgeTone="warning"
        >
          <Text style={styles.memberLine}>
            Member: {request.memberName?.trim() || (request.member_id ? 'Unknown member' : '—')}
          </Text>
          <Text style={styles.meta}>
            Requested by {request.requestedByName ?? 'Unknown shepherd'}
          </Text>
          <Text style={styles.reason}>{request.reason}</Text>
          <Text style={styles.meta}>
            Submitted {new Date(request.created_at).toLocaleString()}
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.reject, Boolean(reviewingId) && styles.buttonDisabled]}
              testID={testIds.admin.assignmentRequests.reject(request.id)}
              disabled={Boolean(reviewingId)}
              onPress={() => void review(request, 'rejected')}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.approve, Boolean(reviewingId) && styles.buttonDisabled]}
              testID={testIds.admin.assignmentRequests.approve(request.id)}
              disabled={Boolean(reviewingId)}
              onPress={() => void review(request, 'approved')}
            >
              <Text style={styles.approveText}>Approve</Text>
            </Pressable>
          </View>
          <Text style={styles.note}>
            Approve records the decision. Reassign the member in Members if needed.
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl },
  memberLine: { color: colors.primary, fontSize: 15, fontWeight: '800', marginBottom: spacing.xs },
  reason: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: spacing.sm },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonDisabled: { opacity: 0.55 },
  reject: { borderColor: colors.border, backgroundColor: colors.surface },
  rejectText: { color: colors.textSecondary, fontWeight: '700' },
  approve: { borderColor: colors.primary, backgroundColor: colors.primary },
  approveText: { color: colors.white, fontWeight: '700' },
  note: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md, lineHeight: 18 },
});
