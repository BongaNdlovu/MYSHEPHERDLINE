import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { TaskListRow } from '@/types/database';

type TaskItemProps = {
  task: TaskListRow;
  onToggle?: () => void;
  toggleTestID?: string;
};

const iconMap: Record<string, React.ComponentProps<typeof FontAwesome>['name']> = {
  call: 'phone',
  visit: 'home',
  bible_study: 'book',
  meeting: 'users',
  other: 'check',
};

export function TaskItem({ task, onToggle, toggleTestID }: TaskItemProps) {
  const completed = task.status === 'completed';
  const iconName = iconMap[task.task_type ?? 'other'] ?? 'check';

  return (
    <View style={styles.item} testID={`task-item-${task.id}`}>
      <View style={[styles.icon, { backgroundColor: colors.infoSoft }]}>
        <FontAwesome name={iconName} size={16} color={colors.info} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{task.title}</Text>
        <Text style={styles.status}>
          {completed ? 'Completed' : task.due_date ? `Due ${task.due_date}` : 'Open'}
        </Text>
      </View>
      <Pressable
        testID={toggleTestID}
        style={[styles.check, completed && styles.checkCompleted]}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
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
  name: { fontSize: 15, fontWeight: '600', color: colors.primary },
  completedName: { textDecorationLine: 'line-through', color: colors.textMuted },
  status: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
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
});
