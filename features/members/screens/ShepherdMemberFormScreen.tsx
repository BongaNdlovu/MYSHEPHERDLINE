import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID={testIds.people.addForm}
      >
        <Text style={styles.title}>Add person</Text>
        <Text style={styles.lead}>
          New members are saved to your congregation and assigned to you for follow-up.
        </Text>

        <SectionHeader title="Basic details" />
        <View style={styles.sectionBody}>
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
        </View>

        <SectionHeader title="Care information" />
        <View style={styles.sectionBody}>
          <View style={styles.defaultsRow}>
            <StatusBadge label="New" tone="success" />
            <StatusBadge label="Low risk" tone="neutral" />
          </View>
          <Text style={styles.defaultsHint}>New people start as new status with low risk.</Text>
          <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
        </View>

        {submitError ? <InlineError message={submitError} /> : null}
      </ScrollView>

      <StickyActionBar
        label="Add to my care list"
        loadingLabel="Saving…"
        loading={saving}
        disabled={saving}
        testID={testIds.people.addSave}
        onPress={save}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  lead: { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
  sectionBody: { paddingHorizontal: spacing.lg },
  defaultsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  defaultsHint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.md, lineHeight: 18 },
});
