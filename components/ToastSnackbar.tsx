import { StyleSheet, Text, View } from 'react-native';

import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useToast } from '@/lib/toast';

export function ToastSnackbar() {
  const { message } = useToast();
  if (!message) return null;

  return (
    <View style={styles.wrap} pointerEvents="none" testID={testIds.toast}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    zIndex: 999,
    elevation: 8,
  },
  text: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});
