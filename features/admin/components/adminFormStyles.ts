import { StyleSheet } from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/theme';

export const adminFormStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  formContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  formContentSticky: { padding: spacing.lg, paddingBottom: spacing.xxl + 80 },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  back: { marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: spacing.lg },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.white, fontWeight: '700' },
  danger: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.md },
  dangerText: { color: colors.accent, fontWeight: '700' },
});

export const adminListStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingTop: spacing.md },
  back: { paddingLeft: spacing.lg, marginBottom: -spacing.md },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    justifyContent: 'center',
    ...shadows.card,
  },
  addText: { color: colors.white, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  rowBody: { flex: 1 },
  name: { fontWeight: '700', color: colors.primary, fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
});
