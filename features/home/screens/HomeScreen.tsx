import Feather from '@expo/vector-icons/Feather';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { NoticeCard } from '@/components/ui/NoticeCard';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { QuickActionButton } from '@/components/ui/QuickActionButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buildAttentionPreview, countAttentionMatches } from '@/features/home/selectors/dashboard';
import { useMembers } from '@/features/members';
import { useTasks } from '@/features/tasks';
import { useAuth } from '@/lib/core/auth';
import { buildMemberAttentionList, type AttentionSection, type MemberAttentionEntry } from '@/lib/core/member-attention';
import { getInitials } from '@/lib/core/names';
import { isInitialLoad, queryDisplayError } from '@/lib/core/query-types';
import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';

const SEARCH_DEBOUNCE_MS = 300;
const SECTION_ORDER: AttentionSection[] = ['overdue', 'urgent_care', 'new_people', 'follow_ups_due', 'recently_updated'];
const SECTION_TITLES: Record<AttentionSection, string> = {
  overdue: 'Overdue',
  urgent_care: 'Urgent Care',
  new_people: 'New People',
  follow_ups_due: 'Follow-ups Due',
  recently_updated: 'Recently Updated',
};

function formatCareMeta(member: MemberAttentionEntry['member']) {
  const stage = member.care_stage.replace(/_/g, ' ');
  const risk = `${member.risk_level} risk`;
  const contact = member.last_contact_at
    ? `Last contact ${new Date(member.last_contact_at).toLocaleDateString()}`
    : 'No contact logged';
  return `${stage} · ${risk} · ${contact}`;
}

function reasonTone(section: AttentionSection): 'urgent' | 'warning' | 'info' {
  if (section === 'overdue' || section === 'urgent_care') return 'urgent';
  if (section === 'new_people') return 'info';
  return 'warning';
}

function AttentionCard({ entry }: { entry: MemberAttentionEntry }) {
  const phone = entry.member.phone?.trim() ?? '';
  const openProfile = () => router.push(`/member/${entry.member.id}`);
  const initials = getInitials(entry.member.full_name);

  return (
    <View style={styles.personCard}>
      <View style={styles.personTopRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Pressable style={styles.personBody} onPress={openProfile} accessibilityRole="button">
          <Text style={styles.personName}>{entry.member.full_name}</Text>
          <StatusBadge label={entry.reasonLabel} tone={reasonTone(entry.section)} />
          <Text style={styles.personMeta}>{formatCareMeta(entry.member)}</Text>
        </Pressable>
        <Pressable style={styles.profileLink} onPress={openProfile} accessibilityRole="button">
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.personActions}>
        <QuickActionButton
          label="Call"
          icon="phone"
          disabled={!phone}
          onPress={() => void Linking.openURL(`tel:${phone}`)}
        />
        <QuickActionButton
          label="WhatsApp"
          icon="message-circle"
          disabled={!phone}
          onPress={() => void Linking.openURL(`https://wa.me/${phone.replace(/[^\d]/g, '')}`)}
        />
        <QuickActionButton
          label="Log Action"
          icon="edit-3"
          onPress={() => router.push(`/log-action/${entry.member.id}`)}
        />
      </View>
    </View>
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
  const showAlertBanner = !membersInitialLoad && !tasksInitialLoad && attentionCount > 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.today.screen}>
      <AppHeader
        title={`Hello, ${profile?.display_name?.split(' ')[0] ?? 'Shepherd'}`}
        subtitle="Here is who needs care today."
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search people in care..."
      />

      {showAlertBanner ? (
        <Pressable style={styles.alertWrap} onPress={() => router.push('/(tabs)/members')}>
          <NoticeCard
            tone="urgent"
            title={`${attentionCount} people need care`}
            message="Open People in Care to manage the full list"
          />
        </Pressable>
      ) : null}

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
  alertWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  personBody: { flex: 1, gap: spacing.xs },
  personName: { fontSize: 15, fontWeight: '700', color: colors.primary },
  personMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  profileLink: { paddingTop: 4 },
  personActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
