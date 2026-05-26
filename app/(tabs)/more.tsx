import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

const quickActions = [
  { title: 'Add Member', subtitle: 'Register a new congregation member', icon: '＋', route: '/(tabs)/members' },
  { title: 'Log Visit', subtitle: 'Record contact with a member', icon: '✎', route: '/log-visit/1' },
  { title: 'Prayer Requests', subtitle: 'Track prayer needs', icon: '🙏', action: 'prayer' },
  { title: 'Elder Assignment', subtitle: 'Manage elder territories', icon: '👤', action: 'elder' },
];

const shortcuts = [
  { title: 'Announcements', icon: '📢' },
  { title: 'Birthdays', icon: '🎂' },
  { title: 'Sign Out', icon: '⎋' },
];

export default function MoreScreen() {
  const { signOut } = useAuth();
  const { showToast } = useToast();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppHeader title="More" subtitle="Quick actions and settings" />

      <View style={styles.grid}>
        {quickActions.map((action) => (
          <Pressable
            key={action.title}
            style={styles.actionCard}
            onPress={() => {
              if (action.route) {
                router.push(action.route as '/(tabs)/members');
                return;
              }
              showToast(`${action.title} opened`);
            }}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <Card title="Shortcuts">
        {shortcuts.map((item) => (
          <Pressable
            key={item.title}
            style={styles.shortcut}
            onPress={() => {
              if (item.title === 'Sign Out') {
                void signOut().then(() => router.replace('/landing'));
                return;
              }
              showToast(`${item.title} list`);
            }}
          >
            <Text style={styles.shortcutIcon}>{item.icon}</Text>
            <Text style={styles.shortcutText}>{item.title}</Text>
            <Text style={styles.shortcutArrow}>›</Text>
          </Pressable>
        ))}
      </Card>
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
  },
  actionIcon: { fontSize: 24, marginBottom: spacing.sm },
  actionTitle: { fontSize: 15, fontWeight: '700', color: colors.primary },
  actionSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  shortcutIcon: { fontSize: 18 },
  shortcutText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
  shortcutArrow: { color: colors.textMuted, fontSize: 18 },
});
