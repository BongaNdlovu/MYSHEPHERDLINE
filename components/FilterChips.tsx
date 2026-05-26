import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type FilterChipsProps<T extends string> = {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
};

export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.white,
  },
});
