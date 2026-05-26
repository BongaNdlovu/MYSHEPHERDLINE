import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  text: { color: '#991b1b', fontWeight: '600', lineHeight: 20 },
});
