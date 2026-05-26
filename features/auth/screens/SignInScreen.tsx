import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { LogoMark } from '@/components/ui/LogoMark';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/core/auth';
import { useToast } from '@/lib/core/toast';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      showToast(error);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <LogoMark size={88} />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue shepherding your congregation.</Text>

        <FormField label="Email" fieldTestId={testIds.auth.email} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <FormField label="Password" fieldTestId={testIds.auth.password} value={password} onChangeText={setPassword} secureTextEntry />

        <Pressable style={styles.button} onPress={onSubmit} disabled={loading} testID={testIds.auth.signInButton}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </Pressable>

        <Link href="/sign-up" asChild>
          <Pressable>
            <Text style={styles.link}>Need an account? Sign up</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xxl, paddingTop: 72 },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: spacing.xl },
  subtitle: { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xxl },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  link: { color: colors.primarySoft, textAlign: 'center', marginTop: spacing.xl, fontWeight: '600' },
});
