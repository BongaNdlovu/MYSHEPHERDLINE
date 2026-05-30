import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, radii, spacing } from '@/constants/theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchTestID?: string;
};

export function AppHeader({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchTestID,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...gradients.header]}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.topRow}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {onSearchChange ? (
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            testID={searchTestID}
            value={searchValue ?? ''}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  leftIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
  titleWrap: { flex: 1 },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  searchIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    padding: 0,
  },
});
