import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors, radii, spacing } from '@/constants/theme';
import { getInitials } from '@/lib/core/names';
import type { MemberListRow, RiskLevel } from '@/types/database';

type MemberListItemProps = {
  member: MemberListRow;
  onPress?: () => void;
  testID?: string;
  needsAttention?: boolean;
};

const riskLabels: Record<RiskLevel, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

const riskTones: Record<RiskLevel, 'urgent' | 'warning' | 'neutral'> = {
  high: 'urgent',
  medium: 'warning',
  low: 'neutral',
};

export function MemberListItem({ member, onPress, testID, needsAttention }: MemberListItemProps) {
  const initials = getInitials(member.full_name);

  return (
    <Pressable
      style={[styles.item, needsAttention && styles.itemAttention]}
      onPress={onPress}
      testID={testID}
      accessibilityLabel={member.full_name}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{member.full_name}</Text>
        <Text style={styles.meta}>
          {member.care_stage.replace(/_/g, ' ')}
          {' · '}
          {member.last_contact_at
            ? `Last contact ${new Date(member.last_contact_at).toLocaleDateString()}`
            : 'No recent contact'}
        </Text>
      </View>
      <StatusBadge label={riskLabels[member.risk_level]} tone={riskTones[member.risk_level]} />
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemAttention: {
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: colors.accentSoft,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.primary },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 3, textTransform: 'capitalize' },
});
