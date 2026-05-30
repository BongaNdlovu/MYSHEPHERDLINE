import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, toneColors } from '@/constants/theme';

type Tone = keyof typeof toneColors;

type Option<T extends string> = { label: string; value: T; tone?: Tone };

export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  horizontal = false,
  testIdForValue,
}: {
  label?: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  horizontal?: boolean;
  testIdForValue?: (value: T) => string | undefined;
}) {
  const content = options.map((option) => {
    const active = option.value === value;
    const tone = toneColors[option.tone ?? 'neutral'];
    return (
      <Pressable
        key={option.value}
        testID={testIdForValue?.(option.value)}
        onPress={() => onChange(option.value)}
        style={[
          styles.chip,
          { borderColor: active ? tone.text : colors.border, backgroundColor: active ? tone.bg : colors.surface },
        ]}
      >
        <Text style={[styles.chipText, { color: active ? tone.text : colors.textSecondary }]} numberOfLines={2}>
          {option.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {horizontal ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { color: colors.textSecondary, fontWeight: '800', marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: 180,
  },
  chipText: { fontWeight: '800', fontSize: 13, lineHeight: 17, textAlign: 'center' },
});
