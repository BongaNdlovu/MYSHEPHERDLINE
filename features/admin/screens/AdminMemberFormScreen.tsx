import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors } from '@/constants/theme';
import { adminFormStyles as styles } from '@/features/admin/components/adminFormStyles';
import { ChoiceChipGroup } from '@/features/admin/components/ChoiceChipGroup';
import { ShepherdPicker } from '@/features/admin/components/ShepherdPicker';
import { useAdminProfiles } from '@/features/admin/hooks/useAdminProfiles';
import {
  createMember,
  deleteMember,
  updateMember,
  useMember,
  type MemberInput,
} from '@/features/members';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { validateOptionalEmail, validateOptionalPhone } from '@/lib/core/validation';
import type { MemberStatus, RiskLevel } from '@/types/database';

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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formReady, setFormReady] = useState(!isEdit);
  const formInitializedRef = useRef(false);
  useAndroidBackNavigation(goBackOrMembersList);

  useEffect(() => {
    if (!isEdit || !member || formInitializedRef.current) return;
    setFullName(member.full_name);
    setPhone(member.phone ?? '');
    setEmail(member.email ?? '');
    setAddress(member.address ?? '');
    setNotes(member.notes ?? '');
    setRiskLevel(member.risk_level);
    setStatus(member.status);
    setAssignedTo(member.assigned_to);
    formInitializedRef.current = true;
    setFormReady(true);
  }, [isEdit, member]);

  const retryLoad = useCallback(() => {
    formInitializedRef.current = false;
    setFormReady(false);
    void refresh();
  }, [refresh]);

  if (isEdit && !formReady) {
    return (
      <View style={styles.centered}>
        <QueryStateView loading={loading} error={error} onRetry={retryLoad} />
      </View>
    );
  }

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

  const save = async () => {
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
    if (!assignedTo) {
      setSubmitError('Assign a shepherd before saving this member.');
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      if (isEdit && id) {
        await updateMember(id, input());
        showToast('Member updated.');
      } else {
        await createMember(input());
        showToast('Member created.');
      }
      goBackOrMembersList();
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to save member.')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await deleteMember(id);
      showToast('Member removed.');
      router.replace('/admin/members');
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to delete member.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen style={styles.screen} contentContainerStyle={styles.formContent} testID={testIds.admin.members.form}>
      <Pressable onPress={goBackOrMembersList} style={styles.back}>
        <Feather name="chevron-left" size={24} color={colors.primary} />
      </Pressable>
      <Text style={styles.title}>{isEdit ? 'Edit member' : 'New member'}</Text>

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

      <ShepherdPicker
        profiles={profiles}
        loading={profilesLoading}
        selectedId={assignedTo}
        onSelect={setAssignedTo}
        getTestId={testIds.admin.members.assignShepherd}
      />

      <ChoiceChipGroup label="Risk level" options={riskLevels} value={riskLevel} onChange={setRiskLevel} />
      <ChoiceChipGroup label="Status" options={statuses} value={status} onChange={setStatus} />

      {submitError ? <InlineError message={submitError} /> : null}

      <Pressable
        style={styles.primary}
        disabled={saving}
        testID={testIds.admin.members.save}
        onPress={() => void save()}
      >
        <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save member'}</Text>
      </Pressable>

      {isEdit ? (
        <Pressable style={styles.danger} disabled={saving} onPress={() => void remove()}>
          <Text style={styles.dangerText}>Delete member</Text>
        </Pressable>
      ) : null}
    </FormScreen>
  );
}
