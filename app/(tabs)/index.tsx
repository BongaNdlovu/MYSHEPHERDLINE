import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { MemberListItem } from '@/components/MemberListItem';
import { QueryStateView } from '@/components/QueryStateView';
import { TaskItem } from '@/components/TaskItem';
import { filterMembers, membersNeedingAttention } from '@/lib/domain/members';
import { groupTasksByDueDate } from '@/lib/domain/tasks';
import { useMembers } from '@/lib/hooks/useMembers';
import { useTasks } from '@/lib/hooks/useTasks';
import { useAuth } from '@/lib/auth';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { data: members, loading: membersLoading, error: membersError } = useMembers();
  const { data: tasks, loading: tasksLoading, error: tasksError, toggleTask } = useTasks();
  const [query, setQuery] = useState('');

  const attentionMembers = useMemo(() => {
    return filterMembers(membersNeedingAttention(members), query, 'all').slice(0, 4);
  }, [members, query]);

  const { today: todayTasks } = groupTasksByDueDate(tasks);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.home.screen}>
      <AppHeader
        title={`Hello, ${profile?.display_name?.split(' ')[0] ?? 'Shepherd'}`}
        subtitle="Members needing attention today"
        searchValue={query}
        onSearchChange={setQuery}
      />

      <Pressable style={styles.alertBanner} onPress={() => router.push('/(tabs)/members')}>
        <View style={styles.alertIcon}>
          <Feather name="alert-circle" size={20} color={colors.white} />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{attentionMembers.length} need follow-up</Text>
          <Text style={styles.alertText}>Tap to review the full member list</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.accent} />
      </Pressable>

      <Card title="Needs Attention" badge={`${attentionMembers.length}`} >
        <View testID={testIds.home.attentionList}>
        <QueryStateView
          loading={membersLoading}
          error={membersError}
          isEmpty={!attentionMembers.length}
          emptyMessage="No members currently flagged for follow-up."
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

      <Card title="Today's Tasks" badge={`${todayTasks.length}`}>
        <QueryStateView
          loading={tasksLoading}
          error={tasksError}
          isEmpty={!todayTasks.length}
          emptyMessage="No open tasks due today."
        />
        {todayTasks.map((task) => (
          <TaskItem key={task.id} task={task} toggleTestID={testIds.tasks.toggle(task.id)} onToggle={() => void toggleTask(task)} />
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
