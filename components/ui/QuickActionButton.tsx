import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function QuickActionButton({
  icon,
  label,
  disabled,
  style,
  ...props
}: PressableProps & { icon: keyof typeof Feather.glyphMap; label: string }) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled, style as StyleProp<ViewStyle>]}
    >
      <Feather name={icon} size={17} color={disabled ? colors.textMuted : colors.primary} />
      <Text style={[styles.label, disabled && styles.labelDisabled]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.5 },
  label: { color: colors.primary, fontWeight: '800', fontSize: 12, lineHeight: 16, textAlign: 'center' },
  labelDisabled: { color: colors.textMuted },
});
