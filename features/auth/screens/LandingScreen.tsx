import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LogoMark } from '@/components/ui/LogoMark';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

const features = [
  { icon: 'users' as const, text: 'Track congregation members' },
  { icon: 'check-square' as const, text: 'Manage shepherding tasks' },
  { icon: 'bar-chart-2' as const, text: 'View activity reports' },
  { icon: 'bell' as const, text: 'Get visit reminders' },
];

export default function LandingScreen() {
  return (
    <LinearGradient colors={['#14532d', '#166534', '#22c55e']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LogoMark size={140} />
          <Text testID={testIds.landing.title} style={styles.title}>MyShepherdLine</Text>
          <Text style={styles.subtitle}>
            Shepherd your congregation with clarity, compassion, and consistency.
          </Text>
        </View>

        <View style={styles.features}>
          {features.map((feature) => (
            <View key={feature.text} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name={feature.icon} size={16} color={colors.white} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <Link href="/sign-in" asChild>
          <Pressable style={styles.primaryButton} testID={testIds.landing.signIn}>
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>
        </Link>
        <Text style={styles.accessNote} testID={testIds.landing.accessNote}>
          Access is managed by your congregation administrator. Contact them if you need an account.
        </Text>
        <Link href="/legal/privacy" asChild>
          <Pressable testID={testIds.landing.privacy}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 48,
    justifyContent: 'flex-end',
  },
  hero: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  features: { gap: 10, marginVertical: 32 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { color: colors.white, fontWeight: '500', fontSize: 14, flex: 1 },
  primaryButton: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: spacing.md,
  },
  accessNote: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  legalLink: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: '600' },
});
