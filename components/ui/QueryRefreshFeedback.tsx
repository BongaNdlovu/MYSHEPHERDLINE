import { StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { AppError } from '@/lib/core/errors';
import { hasStaleRefreshError, isRefreshing } from '@/lib/core/query-types';

type QueryRefreshFeedbackProps = {
  loading: boolean;
  error: AppError | null;
  dataLength: number;
  refreshingLabel: string;
  staleErrorLabel: string;
};

export function QueryRefreshFeedback({
  loading,
  error,
  dataLength,
  refreshingLabel,
  staleErrorLabel,
}: QueryRefreshFeedbackProps) {
  const refreshing = isRefreshing(loading, dataLength);
  const staleError = hasStaleRefreshError(error, dataLength);
  if (!refreshing && !staleError) return null;

  return (
    <>
      {refreshing ? <Text style={styles.refreshing}>{refreshingLabel}</Text> : null}
      {staleError ? <Text style={styles.refreshError}>{staleErrorLabel}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  refreshing: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  refreshError: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
