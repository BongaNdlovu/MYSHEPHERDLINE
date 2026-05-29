import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  loadingLabel?: string;
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loadingLabel, loading, disabled, style, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style as StyleProp<ViewStyle>]}
    >
      <Text style={[styles.text, variant !== 'primary' && styles.textDark]}>
        {loading ? (loadingLabel ?? label) : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryPale },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
  disabled: { opacity: 0.55 },
  text: { color: colors.white, fontWeight: '800', fontSize: 16 },
  textDark: { color: colors.primary },
});
