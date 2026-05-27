import Feather from '@expo/vector-icons/Feather';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { colors } from '@/constants/theme';
import { adminFormStyles as styles } from '@/features/admin/components/adminFormStyles';
import { ShepherdPicker } from '@/features/admin/components/ShepherdPicker';
import type { AppError } from '@/lib/core/errors';
import type { Profile } from '@/types/database';

type AdminEntityFormScreenProps = {
  formTestId: string;
  editTitle: string;
  createTitle: string;
  isEdit: boolean;
  formReady: boolean;
  loading: boolean;
  error: AppError | null;
  onRetryLoad: () => void;
  onBack: () => void;
  profiles: Profile[];
  profilesLoading: boolean;
  assigneeId: string | null;
  onAssigneeSelect: (shepherdId: string) => void;
  assignShepherdTestId: (shepherdId: string) => string;
  saveTestId: string;
  saveLabel: string;
  deleteLabel: string;
  saving: boolean;
  submitError: string | null;
  onSave: () => void;
  onDelete?: () => void;
  children: ReactNode;
};

export function AdminEntityFormScreen({
  formTestId,
  editTitle,
  createTitle,
  isEdit,
  formReady,
  loading,
  error,
  onRetryLoad,
  onBack,
  profiles,
  profilesLoading,
  assigneeId,
  onAssigneeSelect,
  assignShepherdTestId,
  saveTestId,
  saveLabel,
  deleteLabel,
  saving,
  submitError,
  onSave,
  onDelete,
  children,
}: AdminEntityFormScreenProps) {
  if (isEdit && !formReady) {
    return (
      <View style={styles.centered}>
        <QueryStateView loading={loading} error={error} onRetry={onRetryLoad} />
      </View>
    );
  }

  return (
    <FormScreen style={styles.screen} contentContainerStyle={styles.formContent} testID={formTestId}>
      <Pressable onPress={onBack} style={styles.back}>
        <Feather name="chevron-left" size={24} color={colors.primary} />
      </Pressable>
      <Text style={styles.title}>{isEdit ? editTitle : createTitle}</Text>

      {children}

      <ShepherdPicker
        profiles={profiles}
        loading={profilesLoading}
        selectedId={assigneeId}
        onSelect={onAssigneeSelect}
        getTestId={assignShepherdTestId}
      />

      {submitError ? <InlineError message={submitError} /> : null}

      <Pressable style={styles.primary} disabled={saving} testID={saveTestId} onPress={onSave}>
        <Text style={styles.primaryText}>{saving ? 'Saving…' : saveLabel}</Text>
      </Pressable>

      {isEdit && onDelete ? (
        <Pressable style={styles.danger} disabled={saving} onPress={onDelete}>
          <Text style={styles.dangerText}>{deleteLabel}</Text>
        </Pressable>
      ) : null}
    </FormScreen>
  );
}
