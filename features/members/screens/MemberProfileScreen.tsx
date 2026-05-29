import Feather from '@expo/vector-icons/Feather';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InfoRow } from '@/components/ui/InfoRow';
import { QuickActionButton } from '@/components/ui/QuickActionButton';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { testIds } from '@/constants/testIds';
import { colors, gradients, spacing } from '@/constants/theme';
import { useAdminAccess } from '@/features/admin';
import { useMember } from '@/features/members';
import { VisitTimelineItem, useMemberVisits } from '@/features/visits';
import { getInitials } from '@/lib/core/names';
import { isInitialLoad, queryDisplayError } from '@/lib/core/query-types';
import type { CareStage, RiskLevel } from '@/types/database';

const careStageTones: Partial<Record<CareStage, 'info' | 'purple' | 'teal' | 'success' | 'urgent' | 'neutral'>> = {
  new: 'info',
  bible_study: 'purple',
  baptism_interest: 'teal',
  integrated: 'success',
  needs_urgent_care: 'urgent',
  inactive: 'neutral',
};

const riskTones: Record<RiskLevel, 'urgent' | 'warning' | 'neutral'> = {
  high: 'urgent',
  medium: 'warning',
  low: 'neutral',
};

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
  const careStageLabel = member.care_stage.replace(/_/g, ' ');
  const careStageTone = careStageTones[member.care_stage] ?? 'neutral';

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
        <View style={styles.badges}>
          <StatusBadge label={careStageLabel} tone={careStageTone} />
          <StatusBadge label={`${member.risk_level} risk`} tone={riskTones[member.risk_level]} />
        </View>
      </LinearGradient>

      <View style={styles.quickActions}>
        <QuickActionButton
          icon="phone"
          label="Call"
          disabled={!member.phone}
          testID={testIds.memberProfile.call}
          onPress={() => {
            if (!member.phone) return;
            void Linking.openURL(`tel:${member.phone}`);
          }}
        />
        <QuickActionButton
          icon="message-circle"
          label="WhatsApp"
          disabled={!member.phone}
          testID={testIds.memberProfile.whatsapp}
          onPress={() => {
            if (!member.phone) return;
            const normalized = member.phone.replace(/[^\d]/g, '');
            void Linking.openURL(`https://wa.me/${normalized}`);
          }}
        />
        <QuickActionButton
          icon="mail"
          label="SMS"
          disabled={!member.phone}
          testID={testIds.memberProfile.sms}
          onPress={() => {
            if (!member.phone) return;
            void Linking.openURL(`sms:${member.phone}`);
          }}
        />
      </View>

      <View style={styles.actions}>
        <Button
          label="Log Care Action"
          testID={testIds.memberProfile.logVisit}
          onPress={() => router.push(`/log-action/${member.id}`)}
        />
        <Button
          label="Update Care Progress"
          variant="outline"
          testID={testIds.memberProfile.careProgress}
          onPress={() => router.push(`/member/${member.id}/care-progress`)}
        />
        <Button
          label="Request Assignment Change"
          variant="outline"
          testID={testIds.memberProfile.assignmentRequest}
          onPress={() => router.push(`/member/${member.id}/assignment-request`)}
        />
      </View>

      <Card title="Overview">
        <InfoRow icon="phone" label="Phone" value={member.phone ?? 'Not provided'} />
        <InfoRow icon="mail" label="Email" value={member.email ?? 'Not provided'} />
        <InfoRow icon="map-pin" label="Address" value={member.address ?? 'Not provided'} />
        <InfoRow
          icon="clock"
          label="Last contact"
          value={
            member.last_contact_at
              ? new Date(member.last_contact_at).toLocaleDateString()
              : 'No contact logged'
          }
        />
        <InfoRow icon="file-text" label="Notes" value={member.notes ?? 'No notes yet'} />
      </Card>

      <Card title="Care History" badge={visitsInitialLoad ? undefined : `${visits.length}`}>
        <QueryStateView
          loading={visitsInitialLoad}
          error={queryDisplayError(visitsError, visits.length)}
          isEmpty={!visitsInitialLoad && !visitsError && !visits.length}
          emptyMessage="No care actions logged yet."
          onRetry={() => void refreshVisits()}
        />
        <QueryRefreshFeedback
          loading={visitsLoading}
          error={visitsError}
          dataLength={visits.length}
          refreshingLabel="Refreshing visits…"
          staleErrorLabel="Could not refresh visits. Showing last loaded data."
        />
        {!visitsInitialLoad && !visitsError ? (
          <View style={styles.timeline}>
            {visits.map((visit, index) => (
              <View key={visit.id} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  {index < visits.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.timelineContent}>
                  <VisitTimelineItem visit={visit} />
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {hasMore && !visitsLoading ? (
          <Pressable style={styles.loadMore} onPress={() => void loadMore()} disabled={loadingMore}>
            <Text style={styles.loadMoreText}>{loadingMore ? 'Loading…' : 'Load more care history'}</Text>
          </Pressable>
        ) : null}
      </Card>
    </ScrollView>
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  actions: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  timeline: { marginTop: spacing.sm },
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  timelineRail: { width: 16, alignItems: 'center' },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryLight,
    marginTop: spacing.lg + 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  timelineContent: { flex: 1 },
  loadMore: { paddingVertical: spacing.md, alignItems: 'center' },
  loadMoreText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
