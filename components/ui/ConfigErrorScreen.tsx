import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { EnvValidationResult } from '@/lib/core/env';

export function ConfigErrorScreen({ validation }: { validation: Extract<EnvValidationResult, { ok: false }> }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Configuration required</Text>
      <Text style={styles.body}>
        MyShepherdLine cannot start because required environment variables are missing or invalid.
      </Text>
      {validation.missing.map((item) => (
        <Text key={item} style={styles.item}>
          • {item}
        </Text>
      ))}
      <Text style={styles.footer}>
        Local runs need a filled `.env`. Installed builds need the same `EXPO_PUBLIC_*` values set in the selected EAS
        environment, then rebuilt and reinstalled.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xxl,
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.primary, marginBottom: spacing.md },
  body: { color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg },
  item: { color: colors.primary, fontWeight: '600', marginBottom: spacing.sm },
  footer: { color: colors.textMuted, marginTop: spacing.xl, lineHeight: 20 },
});
