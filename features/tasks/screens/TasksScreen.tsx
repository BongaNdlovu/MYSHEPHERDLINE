import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PaginatedFlatList } from '@/components/ui/PaginatedFlatList';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { buildWeekDayStrip, groupTasksByDueDate, TaskItem, useTasks } from '@/features/tasks';
import { getUserMessage } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';
import type { TaskListRow } from '@/types/database';

export default function TasksScreen() {
  const { data: tasks, loading, error, refresh, toggleTask, loadMore, hasMore, loadingMore } = useTasks();
  const { showToast } = useToast();
  const { today, upcoming } = groupTasksByDueDate(tasks);
  const weekDays = buildWeekDayStrip();

  const sections = useMemo(
    () => [
      { key: 'today', title: 'Today', badge: today.length, items: today },
      { key: 'upcoming', title: 'Upcoming', badge: upcoming.length, items: upcoming },
    ],
    [today, upcoming],
  );

  const flatData = useMemo(
    () =>
      sections.flatMap((section) => [
        { type: 'header' as const, key: `${section.key}-header`, section },
        ...section.items.map((task) => ({ type: 'task' as const, key: task.id, task, sectionKey: section.key })),
      ]),
    [sections],
  );

  return (
    <View style={styles.screen} testID={testIds.tasks.screen}>
      <PaginatedFlatList
        data={flatData}
        keyExtractor={(row) => row.key}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => void loadMore()}
        ListHeaderComponent={
          <>
            <AppHeader title="Tasks" subtitle="Stay on top of shepherding work" />
            <View style={styles.calendarRow}>
              {weekDays.map((day) => (
                <View key={day.dateKey} style={[styles.day, day.isToday && styles.dayActive]}>
                  <Text style={[styles.dayLabel, day.isToday && styles.dayLabelActive]}>{day.label}</Text>
                  <Text style={[styles.dayNumber, day.isToday && styles.dayLabelActive]}>{day.dayNumber}</Text>
                </View>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Card title={item.section.title} badge={`${item.section.badge}`}>
                {item.section.key === 'today' ? (
                  <QueryStateView
                    loading={loading}
                    error={error}
                    isEmpty={!item.section.items.length}
                    emptyMessage="No open tasks due today."
                    onRetry={() => void refresh()}
                  />
                ) : (
                  <QueryStateView
                    loading={loading}
                    error={error}
                    isEmpty={!item.section.items.length}
                    emptyMessage="No upcoming tasks."
                    onRetry={() => void refresh()}
                  />
                )}
              </Card>
            );
          }

          const task = item.task as TaskListRow;
          return (
            <TaskItem
              task={task}
              toggleTestID={testIds.tasks.toggle(task.id)}
              onToggle={async () => {
                const err = await toggleTask(task);
                if (err) showToast(getUserMessage(err));
              }}
            />
          );
        }}
        contentContainerStyle={styles.content}
      />
    </View>
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
