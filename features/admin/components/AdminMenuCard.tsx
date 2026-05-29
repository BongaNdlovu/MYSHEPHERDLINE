import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AdminMenuItem } from '@/features/admin/selectors/admin-menu';
import { colors, radii, shadows, spacing } from '@/constants/theme';

type AdminMenuCardProps = {
  item: AdminMenuItem;
  onPress: () => void;
  testID?: string;
};

export function AdminMenuCard({ item, onPress, testID }: AdminMenuCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress} testID={testID}>
      <View style={styles.iconCircle}>
        <Feather name={item.icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: 2 },
});
