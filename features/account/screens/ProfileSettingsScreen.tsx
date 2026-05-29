import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DistrictCongregationPicker } from '@/features/account/components/DistrictCongregationPicker';
import { NotificationSettingsCard } from '@/features/account/components/NotificationSettingsCard';
import { updateProfilePreferences } from '@/features/account/services/profile-preferences.service';
import { AppHeader } from '@/components/ui/AppHeader';
import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/core/auth';
import { createAppError, getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import type { Profile } from '@/types/database';

function ProfilePreferencesForm({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: () => void;
}) {
  const { refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [districtId, setDistrictId] = useState<string | null>(profile.preferred_district_id);
  const [organizationId, setOrganizationId] = useState<string | null>(profile.preferred_organization_id);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const save = async () => {
    if (!districtId || !organizationId) {
      setSubmitError('Select both a district and a conference/congregation.');
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await updateProfilePreferences({
        preferredDistrictId: districtId,
        preferredOrganizationId: organizationId,
      });
      await refreshProfile();
      showToast('Profile preferences saved.');
      onSaved();
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to save preferences.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <InlineError message={submitError} />
      <DistrictCongregationPicker
        districtId={districtId}
        organizationId={organizationId}
        onDistrictChange={setDistrictId}
        onOrganizationChange={setOrganizationId}
        districtTestId={testIds.profileSettings.district}
        congregationTestId={testIds.profileSettings.congregation}
      />
      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        testID={testIds.profileSettings.save}
        onPress={() => void save()}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save preferences'}</Text>
      </Pressable>
    </>
  );
}

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, loading, profileLoading, profileError, refreshProfile } = useAuth();
  const profileStateError = !loading && !session
    ? createAppError('auth', 'Sign in to manage profile settings.')
    : profileError;
  const waitingForProfile = Boolean(session) && !profile && !profileStateError;

  return (
    <FormScreen
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      testID={testIds.profileSettings.screen}
    >
      <AppHeader
        title="Profile Settings"
        subtitle="Your district and conference/congregation"
      />
      <Text style={styles.helper}>
        These preferences help administrators assign you to the right congregation. They do not
        change your active access until an admin updates your account.
      </Text>
      <QueryStateView
        loading={loading || profileLoading || waitingForProfile}
        error={profileStateError}
        onRetry={() => void refreshProfile()}
      />
      {profile ? (
        <ProfilePreferencesForm key={profile.id} profile={profile} onSaved={() => router.back()} />
      ) : null}
      <NotificationSettingsCard />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  helper: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
