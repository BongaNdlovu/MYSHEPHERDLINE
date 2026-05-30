import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, toneColors } from '@/constants/theme';

type Tone = keyof typeof toneColors;

type StatusBadgeProps = {
  label: string;
  tone?: Tone;
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const palette = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  text: { fontSize: 11, fontWeight: '800', lineHeight: 15, textAlign: 'center' },
});
