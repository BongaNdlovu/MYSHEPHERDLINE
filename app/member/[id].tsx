import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { QueryStateView } from '@/components/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useToast } from '@/lib/toast';
import { useMember } from '@/lib/hooks/useMembers';

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, loading, error } = useMember(id);
  const { showToast } = useToast();

  if (loading || error || !member) {
    return (
      <View style={styles.loading}>
        <QueryStateView
          loading={loading}
          error={error ?? (!member && !loading ? 'Member not found.' : null)}
        />
      </View>
    );
  }

  const initials = member.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={styles.screen} testID={testIds.memberProfile.screen}>
      <LinearGradient colors={['#14532d', '#166534', '#15803d']} style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={colors.white} />
        </Pressable>
        <Pressable
          style={[styles.iconButton, styles.editButton]}
          onPress={() => showToast('Profile updates will sync to Supabase in a future release.')}
        >
          <Feather name="edit-2" size={16} color={colors.white} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{member.full_name}</Text>
        <Text style={styles.meta}>
          {member.status.toUpperCase()} | {member.risk_level.toUpperCase()} RISK
        </Text>
      </LinearGradient>

      <Card title="Overview">
        <InfoRow label="Phone" value={member.phone ?? 'Not provided'} />
        <InfoRow label="Email" value={member.email ?? 'Not provided'} />
        <InfoRow label="Address" value={member.address ?? 'Not provided'} />
        <InfoRow
          label="Last contact"
          value={
            member.last_contact_at
              ? new Date(member.last_contact_at).toLocaleDateString()
              : 'No contact logged'
          }
        />
        <InfoRow label="Notes" value={member.notes ?? 'No notes yet'} />
      </Card>

      <Pressable style={styles.primaryButton} testID={testIds.memberProfile.logVisit} onPress={() => router.push(`/log-visit/${member.id}`)}>
        <Text style={styles.primaryButtonText}>Log Visit</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: spacing.xl },
  header: {
    paddingTop: 52,
    paddingBottom: 32,
    alignItems: 'center',
    position: 'relative',
  },
  iconButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: { left: undefined, right: 16 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: '800' },
  name: { color: colors.white, fontSize: 24, fontWeight: '800' },
  meta: { color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: '600', fontSize: 12 },
  infoRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  infoValue: { color: colors.primary, fontSize: 15, fontWeight: '600', marginTop: 4 },
  primaryButton: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
