import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { MemberListRow, RiskLevel } from '@/types/database';

type MemberListItemProps = {
  member: MemberListRow;
  onPress?: () => void;
  testID?: string;
};

const riskLabels: Record<RiskLevel, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

const riskStyles: Record<RiskLevel, { bg: string; color: string }> = {
  high: { bg: colors.accentSoft, color: colors.accent },
  medium: { bg: colors.warningSoft, color: '#b45309' },
  low: { bg: colors.primaryPale, color: colors.primarySoft },
};

export function MemberListItem({ member, onPress, testID }: MemberListItemProps) {
  const risk = riskStyles[member.risk_level];
  const initials = member.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable style={styles.item} onPress={onPress} testID={testID} accessibilityLabel={member.full_name}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{member.full_name}</Text>
        <Text style={styles.meta}>
          {member.last_contact_at
            ? `Last contact ${new Date(member.last_contact_at).toLocaleDateString()}`
            : 'No recent contact'}
        </Text>
      </View>
      <View style={[styles.risk, { backgroundColor: risk.bg }]}>
        <Text style={[styles.riskText, { color: risk.color }]}>{riskLabels[member.risk_level]}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarText: { color: colors.primary, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.primary },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  risk: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  riskText: { fontSize: 11, fontWeight: '800' },
});
