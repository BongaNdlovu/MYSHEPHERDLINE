import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useToast } from '@/lib/core/toast';

const TAB_BAR_BASE_HEIGHT = 56;

export function ToastSnackbar() {
  const { message } = useToast();
  const insets = useSafeAreaInsets();

  if (!message) return null;

  const bottomOffset = TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, spacing.sm) + spacing.md;

  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]} pointerEvents="none" testID={testIds.toast}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
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
