import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NotificationSettingsCard } from '../components/NotificationSettingsCard';
import { accountQuickActions } from '../selectors/quick-actions';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useAdminAccess } from '@/features/admin';
import { useReportSummary } from '@/features/reports';
import { useAuth } from '@/lib/core/auth';
import { useToast } from '@/lib/core/toast';

export default function MoreScreen() {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { isAdmin } = useAdminAccess();
  const { summary } = useReportSummary();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.me.screen}>
      <AppHeader title="Me" subtitle="Your profile, notifications, and weekly care view" />

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

      <NotificationSettingsCard />

      {summary ? (
        <Card title="My Week">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Care actions completed</Text>
            <Text style={styles.summaryValue}>{summary.visitsCompleted}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Open follow-ups</Text>
            <Text style={styles.summaryValue}>{summary.tasksOpen}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bible studies logged</Text>
            <Text style={styles.summaryValue}>{summary.visitBreakdown.bibleStudies}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>People still needing care</Text>
            <Text style={styles.summaryValue}>{summary.membersNeedingAttention}</Text>
          </View>
        </Card>
      ) : null}

      <Card title="Profile">
        <Pressable
          style={styles.shortcut}
          testID={testIds.me.profileSettings}
          onPress={() => router.push('/settings/profile')}
        >
          <Feather name="user" size={18} color={colors.primary} />
          <View style={styles.shortcutBody}>
            <Text style={styles.shortcutText}>My Profile</Text>
            <Text style={styles.shortcutSub}>Set where you serve</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>
      </Card>

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
          testID={testIds.me.signOut}
          onPress={() => {
            void signOut()
              .then(() => {
                if (!mountedRef.current) return;
                router.replace('/landing');
              })
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { color: colors.textSecondary, fontWeight: '600' },
  summaryValue: { color: colors.primary, fontWeight: '800', fontSize: 16 },
});
