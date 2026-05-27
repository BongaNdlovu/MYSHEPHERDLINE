import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { createMemberAsShepherd } from '@/features/members/services/members.service';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { useAuth } from '@/lib/core/auth';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { validateOptionalEmail, validateOptionalPhone } from '@/lib/core/validation';

function goBackToMembers() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/members');
}

export default function ShepherdMemberFormScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useAndroidBackNavigation(goBackToMembers);

  const save = () => {
    const userId = user?.id;
    if (!userId) {
      setSubmitError('Sign in to add a member.');
      return;
    }
    if (!fullName.trim()) {
      setSubmitError('Full name is required.');
      return;
    }

    const nextEmailError = validateOptionalEmail(email);
    const nextPhoneError = validateOptionalPhone(phone);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);
    if (nextEmailError || nextPhoneError) {
      setSubmitError(nextEmailError ?? nextPhoneError ?? 'Check the highlighted fields.');
      return;
    }

    setSaving(true);
    setSubmitError(null);
    void createMemberAsShepherd(userId, { full_name: fullName, phone, email, notes })
      .then(() => {
        showToast('Member added to your care list.');
        goBackToMembers();
      })
      .catch((err) => {
        setSubmitError(getUserMessage(toAppError(err, 'Unable to add member.')));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <FormScreen
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID={testIds.people.addForm}
    >
      <Text style={styles.title}>Add member</Text>
      <Text style={styles.lead}>
        New members are saved to your congregation and assigned to you for follow-up.
      </Text>

      <FormField label="Full name" value={fullName} onChangeText={setFullName} />
      <FormField
        label="Phone"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          setPhoneError(undefined);
        }}
        error={phoneError}
      />
      <FormField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setEmailError(undefined);
        }}
        error={emailError}
        autoCapitalize="none"
      />
      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />

      {submitError ? <InlineError message={submitError} /> : null}

      <Pressable
        style={styles.primary}
        disabled={saving}
        testID={testIds.people.addSave}
        onPress={save}
      >
        <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save member'}</Text>
      </Pressable>

      <Pressable style={styles.secondary} disabled={saving} onPress={goBackToMembers}>
        <Text style={styles.secondaryText}>Cancel</Text>
      </Pressable>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  lead: { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  secondary: { paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  secondaryText: { color: colors.primarySoft, fontWeight: '600' },
});
