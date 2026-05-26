import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import type { AppError } from '@/lib/core/errors';
import { getUserMessage, toAppError } from '@/lib/core/errors';

type FatalErrorScreenProps = {
  error: AppError | Error | unknown;
  title?: string;
  onRetry?: () => void;
};

export function FatalErrorScreen({ error, title = 'Unexpected error', onRetry }: FatalErrorScreenProps) {
  const appError = error instanceof Error ? toAppError(error) : isAppErrorLike(error) ? error : toAppError(error);

  return (
    <View style={styles.screen}>
      <Feather name="alert-triangle" size={36} color={colors.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{getUserMessage(appError)}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      ) : null}
      {__DEV__ && appError.details ? <Text style={styles.details}>{appError.details}</Text> : null}
    </View>
  );
}

function isAppErrorLike(value: unknown): value is AppError {
  return typeof value === 'object' && value !== null && 'category' in value && 'message' in value;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  body: { color: colors.textSecondary, lineHeight: 22, textAlign: 'center' },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonText: { color: colors.white, fontWeight: '700' },
  details: {
    marginTop: spacing.lg,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'SpaceMono',
  },
});
