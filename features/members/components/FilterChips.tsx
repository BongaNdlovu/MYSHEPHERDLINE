import { StyleSheet, View } from 'react-native';

import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { spacing } from '@/constants/theme';
import type { ComponentProps } from 'react';

type Tone = NonNullable<ComponentProps<typeof ChoiceChips>['options'][number]['tone']>;

type FilterChipsProps<T extends string> = {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  testIdForValue?: (value: T) => string;
};

const toneForValue = (value: string): Tone | undefined => {
  if (value === 'urgent') return 'urgent';
  if (value === 'new') return 'success';
  if (value === 'bible_study') return 'purple';
  if (value === 'baptism_interest') return 'teal';
  if (value === 'my_people') return 'neutral';
  return undefined;
};

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  testIdForValue,
}: FilterChipsProps<T>) {
  return (
    <View style={styles.wrap}>
      <ChoiceChips
        horizontal
        options={options.map((option) => ({
          ...option,
          tone: toneForValue(option.value),
        }))}
        value={value}
        onChange={onChange}
        testIdForValue={testIdForValue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
