import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export function QueryStateView({
  loading,
  error,
  emptyMessage,
  isEmpty,
}: {
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  isEmpty?: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (isEmpty) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.text}>{emptyMessage ?? 'Nothing to show yet.'}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.lg },
  text: { color: colors.textSecondary, textAlign: 'center' },
  error: { color: colors.accent, textAlign: 'center', fontWeight: '600' },
});
