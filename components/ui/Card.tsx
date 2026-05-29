import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ComponentProps } from 'react';

type CardProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: ComponentProps<typeof StatusBadge>['tone'];
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Card({ title, subtitle, badge, badgeTone, children, onPress, style }: CardProps) {
  const content = (
    <>
      <View style={styles.titleRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? <StatusBadge label={badge} tone={badgeTone ?? 'neutral'} /> : null}
      </View>
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={[styles.card, style]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
});
