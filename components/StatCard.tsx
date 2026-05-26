import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type StatCardProps = {
  label: string;
  value: string | number;
  tone: 'blue' | 'green' | 'purple' | 'orange';
  onPress?: () => void;
};

const tones = {
  blue: ['#0ea5e9', '#0284c7'],
  green: ['#22c55e', '#16a34a'],
  purple: ['#8b5cf6', '#7c3aed'],
  orange: ['#f97316', '#ea580c'],
} as const;

export function StatCard({ label, value, tone, onPress }: StatCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <LinearGradient colors={[...tones[tone]]} style={styles.card}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: '45%' },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  value: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
});
