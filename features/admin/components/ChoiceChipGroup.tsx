import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type ChoiceChipGroupProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  getTestId?: (value: T) => string;
};

export function ChoiceChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  getTestId,
}: ChoiceChipGroupProps<T>) {
  return (
    <>
      <Text style={styles.section}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, value === option && styles.chipActive]}
            testID={getTestId?.(option)}
            onPress={() => onChange(option)}
          >
            <Text style={styles.chipText}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
});
