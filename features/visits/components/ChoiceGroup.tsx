import { StyleSheet, View } from 'react-native';

import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { spacing } from '@/constants/theme';

export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  testIdPrefix,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  testIdPrefix?: string;
}) {
  return (
    <View style={styles.section}>
      <ChoiceChips
        label={label}
        options={options.map((option) => ({
          label: option.replace(/_/g, ' '),
          value: option,
        }))}
        value={value}
        onChange={onChange}
        testIdForValue={testIdPrefix ? (option) => `${testIdPrefix}-${option}` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
});
