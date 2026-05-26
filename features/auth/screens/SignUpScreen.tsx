import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { LogoMark } from '@/components/ui/LogoMark';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/core/auth';
import { getUserMessage } from '@/lib/core/errors';
import { hasFieldErrors, validateSignUp } from '@/lib/core/validation';
import { useToast } from '@/lib/core/toast';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ displayName?: string; email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    displayName.trim().length > 0 && email.trim().length > 0 && password.length > 0 && !loading;

  const onSubmit = async () => {
    const nextFieldErrors = validateSignUp({ displayName, email, password });
    setFieldErrors(nextFieldErrors);
    setSubmitError(null);

    if (hasFieldErrors(nextFieldErrors)) return;

    setLoading(true);
    const { error } = await signUp(email.trim(), password, displayName.trim());
    setLoading(false);

    if (error) {
      if (error.field) {
        setFieldErrors((current) => ({ ...current, [error.field!]: error.message }));
      } else {
        setSubmitError(getUserMessage(error));
      }
      return;
    }

    showToast('Account created. Check your email if confirmation is required.');
    router.replace('/sign-in');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <LogoMark size={88} />
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Set up your shepherd profile to get started.</Text>

        <InlineError message={submitError} />

        <FormField
          label="Display name"
          fieldTestId={testIds.auth.displayName}
          value={displayName}
          onChangeText={(value) => {
            setDisplayName(value);
            setFieldErrors((current) => ({ ...current, displayName: undefined }));
            setSubmitError(null);
          }}
          error={fieldErrors.displayName}
        />
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
          testID={testIds.auth.signUpButton}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
        </Pressable>
        {!canSubmit && !loading ? <Text style={styles.helper}>Fill in all fields to create your account.</Text> : null}

        <Link href="/sign-in" asChild>
          <Pressable>
            <Text style={styles.link}>Already have an account? Sign in</Text>
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
