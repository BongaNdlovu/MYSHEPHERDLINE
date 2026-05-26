import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { MemberListItem } from '@/components/MemberListItem';
import { TaskItem } from '@/components/TaskItem';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { filterMembers, membersNeedingAttention, useMembers, useTasks } from '@/lib/data';
import { useToast } from '@/lib/toast';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { members } = useMembers();
  const { tasks, toggleTask } = useTasks();
  const [query, setQuery] = useState('');

  const attentionMembers = useMemo(() => {
    const filtered = filterMembers(membersNeedingAttention(members), query, 'all');
    return filtered.slice(0, 4);
  }, [members, query]);

  const todayTasks = tasks.filter((task) => task.status === 'open').slice(0, 3);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppHeader
        title={`Hello, ${profile?.display_name?.split(' ')[0] ?? 'Shepherd'}`}
        subtitle="Members needing attention today"
        searchValue={query}
        onSearchChange={setQuery}
        onFilterPress={() => showToast('Showing high-risk and inactive members')}
      />

      <Pressable style={styles.alertBanner} onPress={() => router.push('/(tabs)/members')}>
        <View style={styles.alertIcon}>
          <Text style={styles.alertIconText}>!</Text>
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{attentionMembers.length} need follow-up</Text>
          <Text style={styles.alertText}>Tap to review the full member list</Text>
        </View>
        <Text style={styles.alertArrow}>›</Text>
      </Pressable>

      <Card title="Needs Attention" badge={`${attentionMembers.length}`}>
        {attentionMembers.map((member) => (
          <MemberListItem
            key={member.id}
            member={member}
            onPress={() => router.push(`/member/${member.id}`)}
          />
        ))}
      </Card>

      <Card title="Today's Tasks" badge={`${todayTasks.length}`}>
        {todayTasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task)} />
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
  alertIconText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  alertContent: { flex: 1 },
  alertTitle: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  alertText: { color: '#991b1b', fontSize: 13, marginTop: 3, opacity: 0.8 },
  alertArrow: { color: colors.accent, fontSize: 18 },
});
