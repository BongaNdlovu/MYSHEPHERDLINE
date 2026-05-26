import { Link, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { LogoMark } from '@/components/ui/LogoMark';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/core/auth';
import { getUserMessage } from '@/lib/core/errors';
import { hasFieldErrors, validateSignIn } from '@/lib/core/validation';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const onSubmit = async () => {
    const nextFieldErrors = validateSignIn({ email, password });
    setFieldErrors(nextFieldErrors);
    setSubmitError(null);

    if (hasFieldErrors(nextFieldErrors)) return;

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    if (!mountedRef.current) return;
    setLoading(false);

    if (error) {
      if (error.field === 'email' || error.field === 'password') {
        setFieldErrors((current) => ({ ...current, [error.field!]: error.message }));
      } else {
        setSubmitError(getUserMessage(error));
      }
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

        <InlineError message={submitError} />

        <FormField
          label="Email"
          fieldTestId={testIds.auth.email}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
            setSubmitError(null);
          }}
          error={fieldErrors.email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <FormField
          label="Password"
          fieldTestId={testIds.auth.password}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
            setSubmitError(null);
          }}
          error={fieldErrors.password}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}
          testID={testIds.auth.signInButton}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </Pressable>
        {!canSubmit && !loading ? <Text style={styles.helper}>Enter your email and password to continue.</Text> : null}

        <Link href="/sign-up" asChild>
          <Pressable>
            <Text style={styles.link}>Need an account? Request access</Text>
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
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  helper: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, fontSize: 13 },
  link: { color: colors.primarySoft, textAlign: 'center', marginTop: spacing.xl, fontWeight: '600' },
});
