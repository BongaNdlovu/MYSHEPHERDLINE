import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

export default function AdminUnauthorizedScreen() {
  return (
    <View style={styles.screen} testID={testIds.admin.unauthorized}>
      <AppHeader title="Not authorized" subtitle="Admin access is restricted" />
      <Text style={styles.body}>
        You do not have permission to open the admin control center. Contact your congregation
        administrator if you need access.
      </Text>
      <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/more')}>
        <Text style={styles.buttonText}>Back to More</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  button: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
