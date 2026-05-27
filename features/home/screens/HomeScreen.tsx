import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { buildAttentionPreview, countAttentionMatches } from '@/features/home/selectors/dashboard';
import { MemberListItem, useMembers } from '@/features/members';
import { groupTasksByDueDate, TaskItem, useTasks } from '@/features/tasks';
import { useAuth } from '@/lib/core/auth';
import { getUserMessage } from '@/lib/core/errors';
import { isInitialLoad, queryDisplayError } from '@/lib/core/query-types';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

const SEARCH_DEBOUNCE_MS = 300;

export default function HomeScreen() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: members, loading: membersLoading, error: membersError, refresh: refreshMembers } =
    useMembers({ attentionOnly: true, search: debouncedQuery || undefined });
  const {
    data: tasks,
    loading: tasksLoading,
    error: tasksError,
    refresh: refreshTasks,
    toggleTask,
    isTaskToggling,
  } = useTasks();

  const attentionMembers = useMemo(() => buildAttentionPreview(members), [members]);
  const attentionCount = useMemo(() => countAttentionMatches(members), [members]);
  const membersInitialLoad = isInitialLoad(membersLoading, members.length);
  const tasksInitialLoad = isInitialLoad(tasksLoading, tasks.length);

  const { today: todayTasks } = groupTasksByDueDate(tasks);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.home.screen}>
      <AppHeader
        title={`Hello, ${profile?.display_name?.split(' ')[0] ?? 'Shepherd'}`}
        subtitle="Members needing attention today"
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search members..."
      />

      <Pressable style={styles.alertBanner} onPress={() => router.push('/(tabs)/members')}>
        <View style={styles.alertIcon}>
          <Feather name="alert-circle" size={20} color={colors.white} />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>
            {membersInitialLoad ? 'Loading follow-ups…' : `${attentionCount} need follow-up`}
          </Text>
          <Text style={styles.alertText}>Tap to review the full member list</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.accent} />
      </Pressable>

      <Card title="Needs Attention" badge={membersInitialLoad ? undefined : `${attentionCount}`}>
        <View testID={testIds.home.attentionList}>
          <QueryStateView
            loading={membersInitialLoad}
            error={queryDisplayError(membersError, members.length)}
            isEmpty={!membersInitialLoad && !membersError && !attentionMembers.length}
            emptyMessage="No members currently flagged for follow-up."
            onRetry={() => void refreshMembers()}
          />
          <QueryRefreshFeedback
            loading={membersLoading}
            error={membersError}
            dataLength={members.length}
            refreshingLabel="Refreshing members…"
            staleErrorLabel="Could not refresh members. Showing last loaded data."
          />
          {!membersInitialLoad && !membersError
            ? attentionMembers.map((member) => (
                <MemberListItem
                  key={member.id}
                  member={member}
                  testID={testIds.members.member(member.id)}
                  onPress={() => router.push(`/member/${member.id}`)}
                />
              ))
            : null}
        </View>
      </Card>

      <Card title="Today's Tasks" badge={tasksInitialLoad ? undefined : `${todayTasks.length}`}>
        <QueryStateView
          loading={tasksInitialLoad}
          error={queryDisplayError(tasksError, tasks.length)}
          isEmpty={!tasksInitialLoad && !tasksError && !todayTasks.length}
          emptyMessage="No open tasks due today."
          onRetry={() => void refreshTasks()}
        />
        <QueryRefreshFeedback
          loading={tasksLoading}
          error={tasksError}
          dataLength={tasks.length}
          refreshingLabel="Refreshing tasks…"
          staleErrorLabel="Could not refresh tasks. Showing last loaded data."
        />
        {!tasksInitialLoad && !tasksError
          ? todayTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                toggleTestID={testIds.tasks.toggle(task.id)}
                toggleDisabled={isTaskToggling(task.id)}
                onToggle={async () => {
                  const err = await toggleTask(task);
                  if (err) showToast(getUserMessage(err));
                }}
              />
            ))
          : null}
      </Card>
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
});
