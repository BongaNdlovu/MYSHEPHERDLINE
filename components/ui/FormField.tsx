import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type FormFieldProps = TextInputProps & {
  label: string;
  fieldTestId?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: 'eye' | 'eye-off';
};

export function FormField({
  label,
  style,
  fieldTestId,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry,
  ...props
}: FormFieldProps) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const isPassword = Boolean(secureTextEntry || rightIcon);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        {leftIcon ? (
          <Feather name={leftIcon} size={18} color={colors.textMuted} style={styles.leftIcon} />
        ) : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          {...props}
          testID={fieldTestId ?? props.testID}
        />
        {rightIcon && isPassword ? (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            style={styles.rightIcon}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  inputRowError: { borderColor: colors.accent },
  leftIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  rightIcon: { marginLeft: spacing.sm, padding: spacing.xs },
  error: { color: colors.accent, fontSize: 12, fontWeight: '600', marginTop: spacing.xs },
  helper: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
});
