import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OwnerRoute } from '@/features/admin';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';

type InAppLink = { title: string; route: '/legal/privacy' | '/legal/terms' };
type ExternalLink = { title: string; url: string };

const inAppLinks: InAppLink[] = [
  { title: 'Privacy Policy', route: '/legal/privacy' },
  { title: 'Terms & Conditions', route: '/legal/terms' },
];

const externalLinks: ExternalLink[] = [
  { title: 'Supabase dashboard', url: 'https://supabase.com/dashboard' },
];

export default function AdminControlsScreen() {
  return (
    <OwnerRoute>
      <ScrollView style={styles.screen} testID={testIds.admin.controls.screen}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather name="chevron-left" size={24} color={colors.primary} />
          </Pressable>
          <AppHeader title="App Controls" subtitle="Compliance links and operator references" />
        </View>

        <Card title="In-app">
          {inAppLinks.map((link) => (
            <Pressable key={link.title} style={styles.row} onPress={() => router.push(link.route)}>
              <Text style={styles.rowText}>{link.title}</Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </Card>

        <Card title="External">
          {externalLinks.map((link) => (
            <Pressable
              key={link.title}
              style={styles.row}
              onPress={() => void Linking.openURL(link.url)}
            >
              <Text style={styles.rowText}>{link.title}</Text>
              <Feather name="external-link" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
          <Text style={styles.note}>
            Account passwords and service-role keys are managed only in Supabase Auth and your hosting
            provider. Never commit credentials to this repository.
          </Text>
        </Card>
      </ScrollView>
    </OwnerRoute>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingTop: spacing.md },
  back: { paddingLeft: spacing.lg, marginBottom: -spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, fontWeight: '600', color: colors.primary },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
});
