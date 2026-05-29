import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export function InfoRow({ icon, label, value }: { icon?: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      {icon ? <Feather name={icon} size={16} color={colors.primarySoft} /> : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { width: 96, color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  value: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: '600' },
});
