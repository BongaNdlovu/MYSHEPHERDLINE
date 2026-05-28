import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { spacing } from '@/constants/theme';
import type { CareStage, MemberStatus, RiskLevel } from '@/types/database';

import { ChoiceGroup } from './ChoiceGroup';
import { careStages, riskLevels, statuses } from '../selectors/log-visit';

type CareChangeSectionProps = {
  careStage: CareStage;
  onCareStageChange: (value: CareStage) => void;
  status: MemberStatus;
  onStatusChange: (value: MemberStatus) => void;
  riskLevel: RiskLevel;
  onRiskLevelChange: (value: RiskLevel) => void;
  memberNotes: string;
  onMemberNotesChange: (value: string | null) => void;
};

export function CareChangeSection({
  careStage,
  onCareStageChange,
  status,
  onStatusChange,
  riskLevel,
  onRiskLevelChange,
  memberNotes,
  onMemberNotesChange,
}: CareChangeSectionProps) {
  return (
    <>
      <ChoiceGroup label="Care stage" value={careStage} options={careStages} onChange={onCareStageChange} />
      <ChoiceGroup label="Status" value={status} options={statuses} onChange={onStatusChange} />
      <ChoiceGroup label="Risk level" value={riskLevel} options={riskLevels} onChange={onRiskLevelChange} />
      <View style={styles.section}>
        <FormField
          label="Care notes"
          value={memberNotes}
          onChangeText={onMemberNotesChange}
          placeholder="Update the person's overall care notes if needed."
          multiline
          style={styles.notesInput}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  notesInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
