import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Switch, Text } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type ToggleCardProps = {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function ToggleCard({ title, enabled, onToggle, disabled }: ToggleCardProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled }}
    >
      <Text style={styles.title}>{title}</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={colors.white}
      />
      {enabled ? <Feather name="chevron-down" size={16} color={colors.textMuted} style={styles.hint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: { flex: 1, color: colors.primary, fontWeight: '700', fontSize: 15 },
  hint: { position: 'absolute', right: spacing.lg + 52, opacity: 0 },
});
