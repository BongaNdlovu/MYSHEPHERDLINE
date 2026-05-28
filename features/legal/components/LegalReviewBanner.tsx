import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '@/constants/theme';
import { isLegalReviewComplete } from '@/features/legal/legal-config';

export function LegalReviewBanner() {
  if (isLegalReviewComplete()) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Legal review required before launch</Text>
      <Text style={styles.body}>
        This notice is draft copy for counsel review. Do not treat it as production-ready until your congregation
        completes docs/compliance/legal-review-signoff.md and sets EXPO_PUBLIC_LEGAL_REVIEW_COMPLETE=true.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  title: { color: '#92400e', fontWeight: '700', fontSize: 14, marginBottom: spacing.xs },
  body: { color: '#78350f', fontSize: 13, lineHeight: 20 },
});
