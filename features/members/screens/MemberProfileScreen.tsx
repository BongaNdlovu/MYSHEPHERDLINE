import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, gradients, radii, spacing } from '@/constants/theme';
import { useAdminAccess } from '@/features/admin';
import { useMember } from '@/features/members';
import { VisitTimelineItem, useMemberVisits } from '@/features/visits';
import { getInitials } from '@/lib/core/names';
import { isInitialLoad, queryDisplayError } from '@/lib/core/query-types';

export default function MemberProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, loading, error, refresh } = useMember(id);
  const {
    data: visits,
    loading: visitsLoading,
    error: visitsError,
    refresh: refreshVisits,
    loadMore,
    hasMore,
    loadingMore,
  } = useMemberVisits(id);
  const { isAdmin } = useAdminAccess();

  if (loading || error || !member) {
    return (
      <View style={styles.loading}>
        <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />
      </View>
    );
  }

  const initials = getInitials(member.full_name);
  const visitsInitialLoad = isInitialLoad(visitsLoading, visits.length);

  return (
    <ScrollView style={styles.screen} testID={testIds.memberProfile.screen}>
      <LinearGradient colors={[...gradients.profile]} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={[styles.iconButton, { top: insets.top + spacing.md }]} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={colors.white} />
        </Pressable>
        <Pressable
          style={[styles.iconButton, styles.editButton, { top: insets.top + spacing.md }]}
          onPress={() => {
            if (isAdmin) router.push(`/admin/members/${member.id}`);
          }}
          disabled={!isAdmin}
        >
          <Feather name="edit-2" size={16} color={colors.white} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{member.full_name}</Text>
        <Text style={styles.meta}>
          {member.status.toUpperCase()} | {member.risk_level.toUpperCase()} RISK
        </Text>
      </LinearGradient>

      <Card title="Overview">
        <InfoRow label="Phone" value={member.phone ?? 'Not provided'} />
        <InfoRow label="Email" value={member.email ?? 'Not provided'} />
        <InfoRow label="Address" value={member.address ?? 'Not provided'} />
        <InfoRow
          label="Last contact"
          value={
            member.last_contact_at
              ? new Date(member.last_contact_at).toLocaleDateString()
              : 'No contact logged'
          }
        />
        <InfoRow label="Notes" value={member.notes ?? 'No notes yet'} />
      </Card>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          testID={testIds.memberProfile.logVisit}
          onPress={() => router.push(`/log-visit/${member.id}`)}
        >
          <Text style={styles.primaryButtonText}>Log Visit</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          testID={testIds.memberProfile.careProgress}
          onPress={() => router.push(`/member/${member.id}/care-progress`)}
        >
          <Text style={styles.secondaryButtonText}>Update Care Progress</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          testID={testIds.memberProfile.assignmentRequest}
          onPress={() => router.push(`/member/${member.id}/assignment-request`)}
        >
          <Text style={styles.secondaryButtonText}>Request Assignment Change</Text>
        </Pressable>
      </View>

      <Card title="Visit History" badge={visitsInitialLoad ? undefined : `${visits.length}`}>
        <QueryStateView
          loading={visitsInitialLoad}
          error={queryDisplayError(visitsError, visits.length)}
          isEmpty={!visitsInitialLoad && !visitsError && !visits.length}
          emptyMessage="No visits logged yet."
          onRetry={() => void refreshVisits()}
        />
        <QueryRefreshFeedback
          loading={visitsLoading}
          error={visitsError}
          dataLength={visits.length}
          refreshingLabel="Refreshing visits…"
          staleErrorLabel="Could not refresh visits. Showing last loaded data."
        />
        {!visitsInitialLoad && !visitsError
          ? visits.map((visit) => <VisitTimelineItem key={visit.id} visit={visit} />)
          : null}
        {hasMore && !visitsLoading ? (
          <Pressable style={styles.loadMore} onPress={() => void loadMore()} disabled={loadingMore}>
            <Text style={styles.loadMoreText}>{loadingMore ? 'Loading…' : 'Load more visits'}</Text>
          </Pressable>
        ) : null}
      </Card>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: spacing.xl },
  header: {
    paddingBottom: 32,
    alignItems: 'center',
    position: 'relative',
  },
  iconButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: { left: undefined, right: 16 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: '800' },
  name: { color: colors.white, fontSize: 24, fontWeight: '800' },
  meta: { color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: '600', fontSize: 12 },
  infoRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  infoValue: { color: colors.primary, fontSize: 15, fontWeight: '600', marginTop: 4 },
  actions: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  loadMore: { paddingVertical: spacing.md, alignItems: 'center' },
  loadMoreText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
