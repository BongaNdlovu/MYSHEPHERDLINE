import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { FormField } from '@/components/ui/FormField';
import { testIds } from '@/constants/testIds';
import { AdminEntityFormScreen } from '@/features/admin/components/AdminEntityFormScreen';
import { ChoiceChipGroup } from '@/features/admin/components/ChoiceChipGroup';
import { useAdminEditForm } from '@/features/admin/hooks/useAdminEditForm';
import { useAdminFormActions } from '@/features/admin/hooks/useAdminFormActions';
import { useAdminProfiles } from '@/features/admin/hooks/useAdminProfiles';
import {
  createMember,
  deleteMember,
  updateMember,
  useMember,
  type MemberInput,
} from '@/features/members';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { useToast } from '@/lib/core/toast';
import { validateOptionalEmail, validateOptionalPhone } from '@/lib/core/validation';
import type { MemberStatus, Member, RiskLevel } from '@/types/database';

function goBackOrMembersList() {
  if (router.canGoBack()) router.back();
  else router.replace('/admin/members');
}

const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];
const statuses: MemberStatus[] = ['new', 'active', 'inactive'];

export default function AdminMemberFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { data: member, loading, error, refresh } = useMember(id);
  const { data: profiles, loading: profilesLoading } = useAdminProfiles();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('low');
  const [status, setStatus] = useState<MemberStatus>('new');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const hydrate = useCallback((next: Member) => {
    setFullName(next.full_name);
    setPhone(next.phone ?? '');
    setEmail(next.email ?? '');
    setAddress(next.address ?? '');
    setNotes(next.notes ?? '');
    setRiskLevel(next.risk_level);
    setStatus(next.status);
    setAssignedTo(next.assigned_to);
  }, []);

  const { formReady, retryLoad } = useAdminEditForm({
    isEdit,
    entity: member,
    loading,
    error,
    refresh,
    hydrate,
  });

  const { saving, submitError, setSubmitError, runSave, runRemove } = useAdminFormActions({
    saveFallbackMessage: 'Unable to save member.',
    removeFallbackMessage: 'Unable to delete member.',
  });

  useAndroidBackNavigation(goBackOrMembersList);

  const input = (): MemberInput => ({
    full_name: fullName,
    phone,
    email,
    address,
    notes,
    risk_level: riskLevel,
    status,
    assigned_to: assignedTo,
  });

  const save = () => {
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

    void runSave(async () => {
      if (isEdit && id) {
        await updateMember(id, input());
        showToast('Member updated.');
      } else {
        await createMember(input());
        showToast('Member created.');
      }
      goBackOrMembersList();
    });
  };

  const remove = () => {
    if (!id) return;
    void runRemove(
      () => deleteMember(id),
      'Member removed.',
      () => router.replace('/admin/members'),
    );
  };

  return (
    <AdminEntityFormScreen
      formTestId={testIds.admin.members.form}
      editTitle="Edit member"
      createTitle="New member"
      isEdit={isEdit}
      formReady={formReady}
      loading={loading}
      error={error}
      onRetryLoad={retryLoad}
      onBack={goBackOrMembersList}
      profiles={profiles}
      profilesLoading={profilesLoading}
      assigneeId={assignedTo}
      onAssigneeSelect={setAssignedTo}
      assignShepherdTestId={testIds.admin.members.assignShepherd}
      saveTestId={testIds.admin.members.save}
      saveLabel="Save member"
      deleteLabel="Delete member"
      deleteConfirmTitle="Delete member?"
      deleteConfirmMessage="This permanently removes the member and their visit history. This cannot be undone."
      saving={saving}
      submitError={submitError}
      onSave={save}
      onDelete={isEdit ? remove : undefined}
    >
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
      <FormField label="Address" value={address} onChangeText={setAddress} />
      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
      <ChoiceChipGroup label="Risk level" options={riskLevels} value={riskLevel} onChange={setRiskLevel} />
      <ChoiceChipGroup label="Status" options={statuses} value={status} onChange={setStatus} />
    </AdminEntityFormScreen>
  );
}
