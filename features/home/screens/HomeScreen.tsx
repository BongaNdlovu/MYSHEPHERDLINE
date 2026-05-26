import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { buildAttentionPreview } from '@/features/home/selectors/dashboard';
import { MemberListItem, useMembers } from '@/features/members';
import { groupTasksByDueDate, TaskItem, useTasks } from '@/features/tasks';
import { useAuth } from '@/lib/core/auth';
import { getUserMessage } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { data: members, loading: membersLoading, error: membersError, refresh: refreshMembers } = useMembers();
  const { data: tasks, loading: tasksLoading, error: tasksError, refresh: refreshTasks, toggleTask } = useTasks();
  const [query, setQuery] = useState('');

  const attentionMembers = useMemo(() => buildAttentionPreview(members, query), [members, query]);

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
            {membersLoading ? 'Loading follow-ups…' : `${attentionMembers.length} need follow-up`}
          </Text>
          <Text style={styles.alertText}>Tap to review the full member list</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.accent} />
      </Pressable>

      <Card title="Needs Attention" badge={membersLoading ? undefined : `${attentionMembers.length}`} >
        <View testID={testIds.home.attentionList}>
        <QueryStateView
          loading={membersLoading}
          error={membersError}
          isEmpty={!attentionMembers.length}
          emptyMessage="No members currently flagged for follow-up."
          onRetry={() => void refreshMembers()}
        />
        {attentionMembers.map((member) => (
          <MemberListItem
            key={member.id}
            member={member}
            testID={testIds.members.member(member.id)}
            onPress={() => router.push(`/member/${member.id}`)}
          />
        ))}
        </View>
      </Card>

      <Card title="Today's Tasks" badge={tasksLoading ? undefined : `${todayTasks.length}`}>
        <QueryStateView
          loading={tasksLoading}
          error={tasksError}
          isEmpty={!todayTasks.length}
          emptyMessage="No open tasks due today."
          onRetry={() => void refreshTasks()}
        />
        {todayTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            toggleTestID={testIds.tasks.toggle(task.id)}
            onToggle={async () => {
              const err = await toggleTask(task);
              if (err) showToast(getUserMessage(err));
            }}
          />
        ))}
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
