import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { LogoMark } from '@/components/ui/LogoMark';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

export default function SignUpScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} testID={testIds.auth.signUpRestricted}>
      <LogoMark size={88} />
      <Text style={styles.title}>Admin-managed access</Text>
      <Text style={styles.subtitle}>
        New shepherd accounts are created by your congregation administrator in Supabase Auth. After
        your account is provisioned, sign in with the credentials you were given.
      </Text>

      <Pressable style={styles.button} onPress={() => router.replace('/sign-in')}>
        <Text style={styles.buttonText}>Back to Sign In</Text>
      </Pressable>

      <Link href="/landing" asChild>
        <Pressable>
          <Text style={styles.link}>Return to welcome</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xxl, paddingTop: 72, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: spacing.xl },
  subtitle: { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xxl, lineHeight: 22 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  link: { color: colors.primarySoft, textAlign: 'center', marginTop: spacing.xl, fontWeight: '600' },
});
