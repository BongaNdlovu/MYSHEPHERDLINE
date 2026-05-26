import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { TaskItem } from '@/components/TaskItem';
import { colors, spacing } from '@/constants/theme';
import { useTasks } from '@/lib/data';
import { useToast } from '@/lib/toast';

export default function TasksScreen() {
  const { tasks, toggleTask } = useTasks();
  const { showToast } = useToast();

  const today = tasks.filter((task) => task.due_date === '2026-05-26');
  const upcoming = tasks.filter((task) => task.due_date !== '2026-05-26');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppHeader
        title="Tasks"
        subtitle="Stay on top of shepherding work"
        searchValue=""
        onSearchChange={() => showToast('Task search filters by title')}
        searchPlaceholder="Search tasks..."
      />

      <View style={styles.calendarRow}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
          <View key={day} style={[styles.day, index === 1 && styles.dayActive]}>
            <Text style={[styles.dayLabel, index === 1 && styles.dayLabelActive]}>{day}</Text>
            <Text style={[styles.dayNumber, index === 1 && styles.dayLabelActive]}>{24 + index}</Text>
          </View>
        ))}
      </View>

      <Card title="Today" badge={`${today.length}`}>
        {today.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task)} />
        ))}
      </Card>

      <Card title="Upcoming">
        {upcoming.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task)} />
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
  },
  day: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 56,
  },
  dayActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  dayNumber: { fontSize: 16, color: colors.primary, fontWeight: '700', marginTop: 4 },
  dayLabelActive: { color: colors.white },
});
