import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { TaskItem } from '@/features/tasks/components/TaskItem';
import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';
import { buildWeekDayStrip, groupTasksByDueDate } from '@/features/tasks/selectors/tasks';
import { useTasks } from '@/features/tasks/hooks/useTasks';

export default function TasksScreen() {
  const { data: tasks, loading, error, toggleTask } = useTasks();
  const { today, upcoming } = groupTasksByDueDate(tasks);
  const weekDays = buildWeekDayStrip();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.tasks.screen}>
      <AppHeader title="Tasks" subtitle="Stay on top of shepherding work" />

      <View style={styles.calendarRow}>
        {weekDays.map((day) => (
          <View key={day.dateKey} style={[styles.day, day.isToday && styles.dayActive]}>
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelActive]}>{day.label}</Text>
            <Text style={[styles.dayNumber, day.isToday && styles.dayLabelActive]}>{day.dayNumber}</Text>
          </View>
        ))}
      </View>

      <Card title="Today" badge={`${today.length}`}>
        <QueryStateView
          loading={loading}
          error={error}
          isEmpty={!today.length}
          emptyMessage="No open tasks due today."
        />
        {today.map((task) => (
          <TaskItem key={task.id} task={task} toggleTestID={testIds.tasks.toggle(task.id)} onToggle={() => void toggleTask(task)} />
        ))}
      </Card>

      <Card title="Upcoming" badge={`${upcoming.length}`}>
        <QueryStateView loading={loading} error={error} isEmpty={!upcoming.length} emptyMessage="No upcoming tasks." />
        {upcoming.map((task) => (
          <TaskItem key={task.id} task={task} toggleTestID={testIds.tasks.toggle(task.id)} onToggle={() => void toggleTask(task)} />
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 24 },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: 4,
  },
  day: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  dayActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  dayNumber: { fontSize: 16, color: colors.primary, fontWeight: '700', marginTop: 4 },
  dayLabelActive: { color: colors.white },
});
