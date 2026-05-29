import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DistrictCongregationPicker } from '@/features/account/components/DistrictCongregationPicker';
import { submitAccessRequest } from '@/features/account/services/profile-preferences.service';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { LogoMark } from '@/components/ui/LogoMark';
import { NoticeCard } from '@/components/ui/NoticeCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { validateDisplayName, validateEmail } from '@/lib/core/validation';
import { useToast } from '@/lib/core/toast';

const MESSAGE_MAX_LENGTH = 250;

export default function AccessRequestScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    const nextEmailError = validateEmail(email);
    const nextNameError = validateDisplayName(displayName);
    setEmailError(nextEmailError);
    setNameError(nextNameError);

    if (nextEmailError || nextNameError) {
      setSubmitError(nextNameError ?? nextEmailError ?? 'Check the form and try again.');
      return;
    }
    if (!districtId || !organizationId) {
      setSubmitError('Select your district and conference/congregation.');
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await submitAccessRequest({
        email,
        displayName,
        preferredDistrictId: districtId,
        preferredOrganizationId: organizationId,
        message,
      });
      setSubmitted(true);
      showToast('Access request submitted.');
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to submit access request.')));
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <FormScreen
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
        testID={testIds.auth.signUpRestricted}
      >
        <LogoMark size={88} />
        <Text style={styles.title}>Request received</Text>
        <NoticeCard
          tone="success"
          message="Your administrator will review your district and congregation. If approved, you will receive an email invitation to set your password and sign in."
        />
        <Button label="Back to Sign In" onPress={() => router.replace('/sign-in')} style={styles.successButton} />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      testID={testIds.auth.signUpRestricted}
    >
      <LogoMark size={88} />
      <Text style={styles.title}>Request access</Text>
      <Text style={styles.subtitle}>
        Submit your details and where you serve. Your administrator reviews requests and sends email invitations to
        approved shepherds.
      </Text>

      <InlineError message={submitError} />

      <SectionHeader title="Your details" />
      <FormField
        label="Full name"
        fieldTestId={testIds.auth.displayName}
        value={displayName}
        onChangeText={(value) => {
          setDisplayName(value);
          setNameError(undefined);
        }}
        error={nameError}
      />
      <FormField
        label="Email"
        fieldTestId={testIds.auth.signUpEmail}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setEmailError(undefined);
        }}
        error={emailError}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <SectionHeader title="Where you serve" />
      <DistrictCongregationPicker
        districtId={districtId}
        organizationId={organizationId}
        onDistrictChange={setDistrictId}
        onOrganizationChange={setOrganizationId}
        districtTestId={testIds.auth.signUpDistrict}
        congregationTestId={testIds.auth.signUpCongregation}
      />

      <FormField
        label="Message (optional)"
        fieldTestId={testIds.auth.signUpMessage}
        value={message}
        onChangeText={(value) => setMessage(value.slice(0, MESSAGE_MAX_LENGTH))}
        multiline
        maxLength={MESSAGE_MAX_LENGTH}
        helperText={`${message.length}/${MESSAGE_MAX_LENGTH}`}
        placeholder="e.g. Elder in Durban Central district"
      />

      <Button
        label="Submit access request"
        loadingLabel="Submitting..."
        loading={saving}
        disabled={saving}
        testID={testIds.auth.signUpSubmit}
        onPress={() => void submit()}
        style={styles.submitButton}
      />

      <Link href="/sign-in" asChild>
        <Pressable>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </Link>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xxl, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: spacing.xl },
  subtitle: { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl, lineHeight: 22 },
  submitButton: { marginTop: spacing.sm },
  successButton: { marginTop: spacing.xl },
  link: { color: colors.primarySoft, textAlign: 'center', marginTop: spacing.xl, fontWeight: '600' },
});
