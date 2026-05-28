import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

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
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.typeRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              style={[styles.typeChip, active && styles.typeChipActive]}
              onPress={() => onChange(option)}
              testID={testIdPrefix ? `${testIdPrefix}-${option}` : undefined}
            >
              <Text style={[styles.typeText, active && styles.typeTextActive]}>{option.replace(/_/g, ' ')}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'none' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { color: colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  typeTextActive: { color: colors.white },
});
