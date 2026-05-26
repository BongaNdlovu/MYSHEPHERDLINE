import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { accountQuickActions } from '../selectors/quick-actions';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useAdminAccess } from '@/features/admin';
import { useAuth } from '@/lib/core/auth';
import { useToast } from '@/lib/core/toast';

export default function MoreScreen() {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { isAdmin } = useAdminAccess();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.more.screen}>
      <AppHeader title="More" subtitle="Quick actions, privacy, and account" />

      {isAdmin ? (
        <Card title="Administration">
          <Pressable
            style={styles.shortcut}
            testID={testIds.admin.entry}
            onPress={() => router.push('/admin')}
          >
            <Feather name="settings" size={18} color={colors.primary} />
            <View style={styles.shortcutBody}>
              <Text style={styles.shortcutText}>Admin Center</Text>
              <Text style={styles.shortcutSub}>Users, members, tasks, and operations</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>
      ) : null}

      <View style={styles.grid}>
        {accountQuickActions.map((action) => (
          <Pressable
            key={action.title}
            style={styles.actionCard}
            onPress={() => router.push(action.route)}
          >
            <Feather name={action.icon} size={22} color={colors.primary} />
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <Card title="Account">
        <Pressable
          style={styles.shortcut}
          testID={testIds.more.signOut}
          onPress={() => {
            void signOut()
              .then(() => router.replace('/landing'))
              .catch(() => showToast('Unable to sign out. Please try again.'));
          }}
        >
          <Feather name="log-out" size={18} color={colors.primary} />
          <Text style={styles.shortcutText}>Sign Out</Text>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>
      </Card>

      <Text style={styles.footer}>
        For data subject requests or security concerns, contact your congregation Information Officer.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  actionTitle: { fontSize: 15, fontWeight: '700', color: colors.primary },
  actionSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  shortcutBody: { flex: 1 },
  shortcutText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  shortcutSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
});
