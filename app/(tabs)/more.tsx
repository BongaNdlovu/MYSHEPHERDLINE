import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

const quickActions = [
  {
    title: 'Add Member',
    subtitle: 'Open the member directory',
    icon: 'user-plus' as const,
    route: '/(tabs)/members' as const,
  },
  {
    title: 'Log Visit',
    subtitle: 'Choose a member to visit',
    icon: 'edit-3' as const,
    route: '/(tabs)/members' as const,
  },
  {
    title: 'Privacy Policy',
    subtitle: 'Read how we handle personal information',
    icon: 'shield' as const,
    route: '/legal/privacy' as const,
  },
  {
    title: 'Terms & Conditions',
    subtitle: 'App usage terms',
    icon: 'file-text' as const,
    route: '/legal/terms' as const,
  },
];

export default function MoreScreen() {
  const { signOut } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.more.screen}>
      <AppHeader title="More" subtitle="Quick actions, privacy, and account" />

      <View style={styles.grid}>
        {quickActions.map((action) => (
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
          onPress={() => void signOut().then(() => router.replace('/landing'))}
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
  shortcutText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
});
