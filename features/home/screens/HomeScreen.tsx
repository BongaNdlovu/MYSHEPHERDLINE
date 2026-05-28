import Feather from '@expo/vector-icons/Feather';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { buildAttentionPreview, countAttentionMatches } from '@/features/home/selectors/dashboard';
import { useMembers } from '@/features/members';
import { useTasks } from '@/features/tasks';
import { useAuth } from '@/lib/core/auth';
import { buildMemberAttentionList, type AttentionSection, type MemberAttentionEntry } from '@/lib/core/member-attention';
import { isInitialLoad, queryDisplayError } from '@/lib/core/query-types';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

const SEARCH_DEBOUNCE_MS = 300;
const SECTION_ORDER: AttentionSection[] = ['overdue', 'urgent_care', 'new_people', 'follow_ups_due', 'recently_updated'];
const SECTION_TITLES: Record<AttentionSection, string> = {
  overdue: 'Overdue',
  urgent_care: 'Urgent Care',
  new_people: 'New People',
  follow_ups_due: 'Follow-ups Due',
  recently_updated: 'Recently Updated',
};

function AttentionCard({ entry }: { entry: MemberAttentionEntry }) {
  const phone = entry.member.phone?.trim() ?? '';

  return (
    <View style={styles.personCard}>
      <View style={styles.personTopRow}>
        <View style={styles.personBody}>
          <Text style={styles.personName}>{entry.member.full_name}</Text>
          <Text style={styles.personReason}>{entry.reasonLabel}</Text>
          <Text style={styles.personMeta}>
            {entry.member.care_stage.replace(/_/g, ' ')} · {entry.member.risk_level} risk
            {entry.member.last_contact_at
              ? ` · Last contact ${new Date(entry.member.last_contact_at).toLocaleDateString()}`
              : ' · No contact logged'}
          </Text>
        </View>
        <Pressable style={styles.profileLink} onPress={() => router.push(`/member/${entry.member.id}`)}>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.personActions}>
        <QuickButton
          label="Call"
          icon="phone"
          disabled={!phone}
          onPress={() => void Linking.openURL(`tel:${phone}`)}
        />
        <QuickButton
          label="WhatsApp"
          icon="message-circle"
          disabled={!phone}
          onPress={() => void Linking.openURL(`https://wa.me/${phone.replace(/[^\d]/g, '')}`)}
        />
        <QuickButton
          label="Log Action"
          icon="edit-3"
          onPress={() => router.push(`/log-action/${entry.member.id}`)}
        />
      </View>
    </View>
  );
}

function QuickButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable style={[styles.quickButton, disabled && styles.quickButtonDisabled]} onPress={onPress} disabled={disabled}>
      <Feather name={icon} size={14} color={disabled ? colors.textMuted : colors.primary} />
      <Text style={[styles.quickButtonText, disabled && styles.quickButtonTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: members, loading: membersLoading, error: membersError, refresh: refreshMembers } =
    useMembers({ search: debouncedQuery || undefined });
  const { data: tasks, loading: tasksLoading, error: tasksError, refresh: refreshTasks } = useTasks({
    status: 'open',
  });

  const attentionEntries = useMemo(() => buildMemberAttentionList(members, tasks), [members, tasks]);
  const attentionPreview = useMemo(() => buildAttentionPreview(members, tasks, 4), [members, tasks]);
  const attentionCount = useMemo(() => countAttentionMatches(members, tasks), [members, tasks]);
  const groupedSections = useMemo(
    () =>
      SECTION_ORDER.map((section) => ({
        key: section,
        title: SECTION_TITLES[section],
        items: attentionEntries.filter((entry) => entry.section === section),
      })).filter((section) => section.items.length > 0),
    [attentionEntries],
  );
  const membersInitialLoad = isInitialLoad(membersLoading, members.length);
  const tasksInitialLoad = isInitialLoad(tasksLoading, tasks.length);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.today.screen}>
      <AppHeader
        title={`Hello, ${profile?.display_name?.split(' ')[0] ?? 'Shepherd'}`}
        subtitle="Here is who you must care for today."
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search people in care..."
      />

      <Pressable style={styles.alertBanner} onPress={() => router.push('/(tabs)/members')}>
        <View style={styles.alertIcon}>
          <Feather name="heart" size={20} color={colors.white} />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>
            {membersInitialLoad || tasksInitialLoad ? 'Building today’s care list…' : `${attentionCount} people need care`}
          </Text>
          <Text style={styles.alertText}>Open People in Care to manage the full list</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.accent} />
      </Pressable>

      <Card title="Today" badge={membersInitialLoad || tasksInitialLoad ? undefined : `${attentionCount}`}>
        <View testID={testIds.today.attentionList}>
          <QueryStateView
            loading={membersInitialLoad || tasksInitialLoad}
            error={queryDisplayError(membersError ?? tasksError, attentionEntries.length)}
            isEmpty={!membersInitialLoad && !tasksInitialLoad && !membersError && !tasksError && !attentionEntries.length}
            emptyMessage="No people need care right now."
            onRetry={() => {
              void refreshMembers();
              void refreshTasks();
            }}
          />
          <QueryRefreshFeedback
            loading={membersLoading || tasksLoading}
            error={membersError ?? tasksError}
            dataLength={attentionEntries.length}
            refreshingLabel="Refreshing today’s care list…"
            staleErrorLabel="Could not refresh everything. Showing last loaded data."
          />
          {!membersInitialLoad && !tasksInitialLoad && !membersError && !tasksError
            ? attentionPreview.map((entry) => <AttentionCard key={entry.member.id} entry={entry} />)
            : null}
        </View>
      </Card>

      {!membersInitialLoad && !tasksInitialLoad && !membersError && !tasksError
        ? groupedSections.map((section) => (
            <Card key={section.key} title={section.title} badge={`${section.items.length}`}>
              {section.items.map((entry) => (
                <AttentionCard key={`${section.key}-${entry.member.id}`} entry={entry} />
              ))}
            </Card>
          ))
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 24 },
  alertBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: { flex: 1 },
  alertTitle: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  alertText: { color: '#991b1b', fontSize: 13, marginTop: 3, opacity: 0.8 },
  personCard: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  personTopRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  personBody: { flex: 1 },
  personName: { fontSize: 15, fontWeight: '700', color: colors.primary },
  personReason: { fontSize: 13, color: colors.accent, fontWeight: '700', marginTop: 4 },
  personMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  profileLink: { paddingTop: 4 },
  personActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickButtonDisabled: { opacity: 0.5 },
  quickButtonText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  quickButtonTextDisabled: { color: colors.textMuted },
});
