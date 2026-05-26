import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTasks } from '@/features/tasks';
import { AppHeader } from '@/components/ui/AppHeader';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

export default function AdminTasksScreen() {
  const { data: tasks, loading, error, refresh } = useTasks();

  return (
    <ScrollView style={styles.screen} testID={testIds.admin.tasks.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </Pressable>
        <AppHeader title="Tasks" subtitle="Create, assign, and close shepherding tasks" />
      </View>

      <Pressable
        style={styles.addButton}
        testID={testIds.admin.tasks.add}
        onPress={() => router.push('/admin/tasks/new')}
      >
        <Feather name="plus" size={18} color={colors.white} />
        <Text style={styles.addText}>Add task</Text>
      </Pressable>

      <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />

      {!loading && !error
        ? tasks.map((task) => (
            <Pressable
              key={task.id}
              style={styles.row}
              testID={testIds.admin.tasks.item(task.id)}
              onPress={() => router.push(`/admin/tasks/${task.id}`)}
            >
              <Text style={styles.name}>{task.title}</Text>
              <Text style={styles.meta}>
                {task.status} · {task.priority} priority
                {task.due_date ? ` · due ${task.due_date}` : ''}
              </Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingTop: spacing.md },
  back: { paddingLeft: spacing.lg, marginBottom: -spacing.md },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  addText: { color: colors.white, fontWeight: '700' },
  row: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontWeight: '700', color: colors.primary, fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
