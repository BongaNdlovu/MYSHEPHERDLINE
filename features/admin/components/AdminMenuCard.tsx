import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { AdminMenuItem } from '@/features/admin/selectors/admin-menu';
import { colors, radii, spacing } from '@/constants/theme';

type AdminMenuCardProps = {
  item: AdminMenuItem;
  onPress: () => void;
  testID?: string;
};

export function AdminMenuCard({ item, onPress, testID }: AdminMenuCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress} testID={testID}>
      <Feather name={item.icon} size={22} color={colors.primary} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      <Feather name="chevron-right" size={18} color={colors.textMuted} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, paddingRight: 24 },
  chevron: { position: 'absolute', right: spacing.lg, top: spacing.lg },
});
