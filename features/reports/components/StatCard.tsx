import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type StatCardProps = {
  label: string;
  value: string | number;
  tone: 'blue' | 'green' | 'purple' | 'orange';
  onPress?: () => void;
};

const iconForTone: Record<StatCardProps['tone'], keyof typeof Feather.glyphMap> = {
  blue: 'users',
  green: 'phone',
  purple: 'book-open',
  orange: 'user-plus',
};

const accentForTone: Record<StatCardProps['tone'], string> = {
  blue: colors.info,
  green: colors.primarySoft,
  purple: colors.purple,
  orange: colors.orange,
};

const softForTone: Record<StatCardProps['tone'], string> = {
  blue: colors.infoSoft,
  green: colors.primaryPale,
  purple: colors.purpleSoft,
  orange: colors.orangeSoft,
};

export function StatCard({ label, value, tone, onPress }: StatCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: softForTone[tone] }]}>
          <Feather name={iconForTone[tone]} size={20} color={accentForTone[tone]} />
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: '45%' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    minHeight: 112,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
