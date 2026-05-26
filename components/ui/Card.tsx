import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type CardProps = {
  title: string;
  badge?: string;
  children: React.ReactNode;
  onPress?: () => void;
};

export function Card({ title, badge, children, onPress }: CardProps) {
  const content = (
    <>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
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
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
});
