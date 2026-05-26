import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import {
  createMember,
  deleteMember,
  updateMember,
  useMember,
  type MemberInput,
} from '@/features/members';
import { useToast } from '@/lib/core/toast';
import type { MemberStatus, RiskLevel } from '@/types/database';

const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];
const statuses: MemberStatus[] = ['new', 'active', 'inactive'];

export default function AdminMemberFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { data: member, loading, error, refresh } = useMember(id);
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('low');
  const [status, setStatus] = useState<MemberStatus>('new');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!member) return;
    setFullName(member.full_name);
    setPhone(member.phone ?? '');
    setEmail(member.email ?? '');
    setAddress(member.address ?? '');
    setNotes(member.notes ?? '');
    setRiskLevel(member.risk_level);
    setStatus(member.status);
  }, [member]);

  if (isEdit && (loading || error || !member)) {
    return (
      <View style={styles.centered}>
        <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />
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
  });

  const save = async () => {
    if (!fullName.trim()) {
      setSubmitError('Full name is required.');
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
      router.back();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save member.');
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
      setSubmitError(err instanceof Error ? err.message : 'Unable to delete member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} testID={testIds.admin.members.form}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="chevron-left" size={24} color={colors.primary} />
      </Pressable>
      <Text style={styles.title}>{isEdit ? 'Edit member' : 'New member'}</Text>

      <FormField label="Full name" value={fullName} onChangeText={setFullName} />
      <FormField label="Phone" value={phone} onChangeText={setPhone} />
      <FormField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <FormField label="Address" value={address} onChangeText={setAddress} />
      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />

      <Text style={styles.section}>Risk level</Text>
      <View style={styles.chips}>
        {riskLevels.map((level) => (
          <Pressable
            key={level}
            style={[styles.chip, riskLevel === level && styles.chipActive]}
            onPress={() => setRiskLevel(level)}
          >
            <Text style={styles.chipText}>{level}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Status</Text>
      <View style={styles.chips}>
        {statuses.map((value) => (
          <Pressable
            key={value}
            style={[styles.chip, status === value && styles.chipActive]}
            onPress={() => setStatus(value)}
          >
            <Text style={styles.chipText}>{value}</Text>
          </Pressable>
        ))}
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  back: { marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: spacing.lg },
  section: { fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#ecfdf5' },
  chipText: { fontWeight: '600', color: colors.primary, textTransform: 'capitalize' },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.white, fontWeight: '700' },
  danger: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.md },
  dangerText: { color: colors.accent, fontWeight: '700' },
});
