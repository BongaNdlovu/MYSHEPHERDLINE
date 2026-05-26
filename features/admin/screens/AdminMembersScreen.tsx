import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMembers } from '@/features/members';
import { AppHeader } from '@/components/ui/AppHeader';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

export default function AdminMembersScreen() {
  const { data: members, loading, error, refresh } = useMembers();

  return (
    <ScrollView style={styles.screen} testID={testIds.admin.members.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </Pressable>
        <AppHeader title="Members" subtitle="Create and maintain congregation members" />
      </View>

      <Pressable
        style={styles.addButton}
        testID={testIds.admin.members.add}
        onPress={() => router.push('/admin/members/new')}
      >
        <Feather name="plus" size={18} color={colors.white} />
        <Text style={styles.addText}>Add member</Text>
      </Pressable>

      <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />

      {!loading && !error
        ? members.map((member) => (
            <Pressable
              key={member.id}
              style={styles.row}
              testID={testIds.admin.members.item(member.id)}
              onPress={() => router.push(`/admin/members/${member.id}`)}
            >
              <Text style={styles.name}>{member.full_name}</Text>
              <Text style={styles.meta}>
                {member.status} · {member.risk_level} risk
              </Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingTop: spacing.md },
  back: { paddingLeft: spacing.lg, marginBottom: -spacing.md },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  addText: { color: colors.white, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { flex: 1, fontWeight: '700', color: colors.primary, fontSize: 15 },
  meta: { width: '100%', color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
