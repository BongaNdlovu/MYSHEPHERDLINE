import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import type { AppError, AppErrorCategory } from '@/lib/core/errors';
import { getUserMessage } from '@/lib/core/errors';

type QueryStateViewProps = {
  loading: boolean;
  error: AppError | null;
  emptyMessage?: string;
  isEmpty?: boolean;
  onRetry?: () => void;
};

const CATEGORY_COPY: Record<
  AppErrorCategory,
  { title: string; icon: keyof typeof Feather.glyphMap; hint?: string }
> = {
  config: { title: 'Configuration required', icon: 'settings' },
  network: { title: 'Connection problem', icon: 'wifi-off', hint: 'Check your internet connection.' },
  auth: { title: 'Sign in required', icon: 'lock', hint: 'Sign in to view this content.' },
  forbidden: { title: 'Access denied', icon: 'shield-off', hint: 'You do not have permission to view this.' },
  validation: { title: 'Check your input', icon: 'alert-circle' },
  not_found: { title: 'Not found', icon: 'search' },
  server: { title: 'Server error', icon: 'cloud-off' },
  unknown: { title: 'Something went wrong', icon: 'alert-triangle' },
};

export function QueryStateView({
  loading,
  error,
  emptyMessage,
  isEmpty,
  onRetry,
}: QueryStateViewProps) {
  if (loading) {
    return (
      <View style={styles.wrap} accessibilityRole="progressbar">
        <Feather name="loader" size={22} color={colors.textMuted} />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    const copy = CATEGORY_COPY[error.category];
    const canRetry = error.retryable && onRetry;

    return (
      <View style={styles.wrap} accessibilityRole="alert">
        <Feather name={copy.icon} size={28} color={colors.accent} />
        <Text style={styles.errorTitle}>{copy.title}</Text>
        <Text style={styles.errorMessage}>{getUserMessage(error)}</Text>
        {copy.hint ? <Text style={styles.hint}>{copy.hint}</Text> : null}
        {canRetry ? (
          <Pressable style={styles.retryButton} onPress={onRetry} accessibilityRole="button">
            <Feather name="refresh-cw" size={16} color={colors.white} />
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
        {__DEV__ && error.details ? <Text style={styles.diagnostics}>{error.details}</Text> : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.wrap}>
        <Feather name="inbox" size={26} color={colors.textMuted} />
        <Text style={styles.text}>{emptyMessage ?? 'Nothing to show yet.'}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  errorTitle: { color: colors.primary, textAlign: 'center', fontWeight: '800', fontSize: 16 },
  errorMessage: { color: colors.accent, textAlign: 'center', fontWeight: '600', lineHeight: 20 },
  hint: { color: colors.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  retryText: { color: colors.white, fontWeight: '700' },
  diagnostics: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'SpaceMono',
  },
});
