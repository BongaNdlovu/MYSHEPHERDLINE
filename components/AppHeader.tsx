import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightIcon?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onFilterPress?: () => void;
};

export function AppHeader({
  title,
  subtitle,
  rightIcon,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search members...',
  onFilterPress,
}: AppHeaderProps) {
  return (
    <LinearGradient colors={['#14532d', '#166534', '#15803d']} style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightIcon}
      </View>
      {onSearchChange ? (
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={searchValue ?? ''}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.input}
          />
          {onFilterPress ? (
            <Pressable onPress={onFilterPress} hitSlop={8}>
              <Text style={styles.filterIcon}>☰</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleWrap: { flex: 1 },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: { color: 'rgba(255,255,255,0.45)', fontSize: 16 },
  filterIcon: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginLeft: spacing.sm },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    padding: 0,
  },
});
