import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { Task } from '@/types/database';

type TaskItemProps = {
  task: Task;
  onToggle?: () => void;
};

const iconStyles: Record<string, { bg: string; color: string; glyph: string }> = {
  call: { bg: colors.infoSoft, color: colors.info, glyph: '☎' },
  visit: { bg: colors.purpleSoft, color: colors.purple, glyph: '⌂' },
  bible_study: { bg: colors.orangeSoft, color: colors.orange, glyph: '✦' },
  meeting: { bg: colors.primaryWash, color: colors.textSecondary, glyph: '◉' },
  other: { bg: colors.tealSoft, color: colors.teal, glyph: '✓' },
};

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const icon = iconStyles[task.task_type ?? 'other'] ?? iconStyles.other;
  const completed = task.status === 'completed';

  return (
    <View style={styles.item}>
      <View style={[styles.icon, { backgroundColor: icon.bg }]}>
        <Text style={{ color: icon.color, fontSize: 18 }}>{icon.glyph}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, completed && styles.completedName]}>{task.title}</Text>
        <Text style={styles.status}>
          {completed ? 'Completed' : task.due_date ? `Due ${task.due_date}` : 'Open'}
        </Text>
      </View>
      <Pressable
        style={[styles.check, completed && styles.checkCompleted]}
        onPress={onToggle}
      >
        {completed ? <Text style={styles.checkMark}>✓</Text> : null}
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
  checkMark: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
