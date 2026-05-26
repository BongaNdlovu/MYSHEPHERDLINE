import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { LogoMark } from '@/components/LogoMark';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    const { error } = await signUp(email.trim(), password, displayName.trim());
    setLoading(false);
    if (error) {
      showToast(error);
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

        <FormField label="Display name" value={displayName} onChangeText={setDisplayName} />
        <FormField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <FormField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
        </Pressable>

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
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  link: { color: colors.primarySoft, textAlign: 'center', marginTop: spacing.xl, fontWeight: '600' },
});
