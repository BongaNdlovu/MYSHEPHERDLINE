import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, toneColors } from '@/constants/theme';

type Tone = keyof typeof toneColors;

const defaultToneForValue = (value: string): Tone => {
  const map: Record<string, Tone> = {
    low: 'success',
    medium: 'warning',
    high: 'urgent',
    new: 'info',
    active: 'success',
    inactive: 'neutral',
    open: 'info',
    completed: 'success',
    cancelled: 'neutral',
    admin: 'purple',
    shepherd: 'info',
    owner: 'purple',
  };
  return map[value] ?? 'neutral';
};

type ChoiceChipGroupProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  getTestId?: (value: T) => string;
  getTone?: (value: T) => Tone;
};

export function ChoiceChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  getTestId,
  getTone,
}: ChoiceChipGroupProps<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = value === option;
          const tone = toneColors[getTone?.(option) ?? defaultToneForValue(option)];
          return (
            <Pressable
              key={option}
              style={[
                styles.chip,
                { borderColor: active ? tone.text : colors.border, backgroundColor: active ? tone.bg : colors.surface },
              ]}
              testID={getTestId?.(option)}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.chipText, { color: active ? tone.text : colors.textSecondary }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  section: { fontWeight: '800', color: colors.textSecondary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipText: { fontWeight: '800', fontSize: 13, textTransform: 'capitalize' },
});
