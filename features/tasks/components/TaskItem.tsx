import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Linking from 'expo-linking';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatTaskDueDate, normalizeDueDateKey, toDateKey } from '@/features/tasks/selectors/tasks';
import { colors, radii, spacing } from '@/constants/theme';
import type { TaskListRow, TaskPriority } from '@/types/database';

type TaskItemProps = {
  task: TaskListRow;
  onToggle?: () => void;
  toggleTestID?: string;
  toggleDisabled?: boolean;
};

const iconMap: Record<string, ComponentProps<typeof FontAwesome>['name']> = {
  call: 'phone',
  visit: 'home',
  whatsapp: 'comment',
  bible_study: 'book',
  prayer: 'heart',
  invite: 'user-plus',
  check_in: 'commenting',
  other: 'check',
};

const priorityLabels: Record<TaskPriority, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

const priorityTones: Record<TaskPriority, 'urgent' | 'warning' | 'neutral'> = {
  high: 'urgent',
  medium: 'warning',
  low: 'neutral',
};

export function TaskItem({ task, onToggle, toggleTestID, toggleDisabled }: TaskItemProps) {
  const completed = task.status === 'completed';
  const iconName = iconMap[task.task_type ?? 'other'] ?? 'check';
  const formattedDueDate = formatTaskDueDate(task.due_date);
  const phone = task.member?.phone?.trim() ?? '';
  const dueKey = normalizeDueDateKey(task.due_date);
  const isOverdue = !completed && dueKey !== null && dueKey < toDateKey();

  return (
    <View style={styles.item} testID={`task-item-${task.id}`}>
      <View style={[styles.icon, { backgroundColor: colors.infoSoft }]}>
        <FontAwesome name={iconName} size={16} color={colors.info} />
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, completed && styles.completedName]}>{task.title}</Text>
          {!completed ? (
            isOverdue ? (
              <StatusBadge label="OVERDUE" tone="urgent" />
            ) : (
              <StatusBadge label={priorityLabels[task.priority]} tone={priorityTones[task.priority]} />
            )
          ) : null}
        </View>
        {task.member?.full_name ? <Text style={styles.memberName}>{task.member.full_name}</Text> : null}
        <Text style={styles.status}>
          {completed
            ? 'Completed'
            : formattedDueDate
              ? `Due ${formattedDueDate}${isOverdue ? '' : ` · ${task.priority} priority`}`
              : `${task.priority} priority`}
        </Text>
        {!completed && phone ? (
          <View style={styles.shortcuts}>
            <Pressable style={styles.shortcut} onPress={() => void Linking.openURL(`tel:${phone}`)}>
              <Text style={styles.shortcutText}>Call</Text>
            </Pressable>
            <Pressable
              style={styles.shortcut}
              onPress={() => void Linking.openURL(`https://wa.me/${phone.replace(/[^\d]/g, '')}`)}
            >
              <Text style={styles.shortcutText}>WhatsApp</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <Pressable
        testID={toggleTestID}
        style={[styles.check, completed && styles.checkCompleted, toggleDisabled && styles.checkDisabled]}
        onPress={onToggle}
        disabled={toggleDisabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed, disabled: toggleDisabled }}
      >
        {completed ? <Feather name="check" size={12} color={colors.white} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
  completedName: { textDecorationLine: 'line-through', color: colors.textMuted },
  status: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  memberName: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontWeight: '600' },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCompleted: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  checkDisabled: { opacity: 0.5 },
  shortcuts: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  shortcut: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryPale,
  },
  shortcutText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});
