import { StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { colors, spacing } from '@/constants/theme';
import type { TaskPriority } from '@/types/database';

import { ChoiceGroup } from './ChoiceGroup';
import { followUpTypes, priorities } from '../selectors/log-visit';

type FollowUpType = (typeof followUpTypes)[number];

type FollowUpSectionProps = {
  followUpType: FollowUpType;
  onFollowUpTypeChange: (value: FollowUpType) => void;
  followUpPriority: TaskPriority;
  onFollowUpPriorityChange: (value: TaskPriority) => void;
  followUpDate: string;
  onFollowUpDateChange: (value: string) => void;
  followUpTime: string;
  onFollowUpTimeChange: (value: string) => void;
};

export function FollowUpSection({
  followUpType,
  onFollowUpTypeChange,
  followUpPriority,
  onFollowUpPriorityChange,
  followUpDate,
  onFollowUpDateChange,
  followUpTime,
  onFollowUpTimeChange,
}: FollowUpSectionProps) {
  return (
    <>
      <ChoiceGroup
        label="Follow-up type"
        value={followUpType}
        options={followUpTypes}
        onChange={onFollowUpTypeChange}
      />
      <ChoiceGroup label="Priority" value={followUpPriority} options={priorities} onChange={onFollowUpPriorityChange} />
      <View style={styles.section}>
        <FormField
          label="Due date"
          value={followUpDate}
          onChangeText={onFollowUpDateChange}
          placeholder="YYYY-MM-DD"
        />
        <FormField
          label="Reminder time"
          value={followUpTime}
          onChangeText={onFollowUpTimeChange}
          placeholder="HH:mm"
        />
        <Text style={styles.helper}>Follow-ups are assigned to you and will create a care task automatically.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  helper: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
