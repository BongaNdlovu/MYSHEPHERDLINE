export const colors = {
  primary: '#14532d',
  primarySoft: '#166534',
  primaryLight: '#22c55e',
  primaryLighter: '#86efac',
  primaryPale: '#dcfce7',
  primaryWash: '#f0fdf4',
  accent: '#ef4444',
  accentSoft: '#fef2f2',
  warning: '#f59e0b',
  warningSoft: '#fffbeb',
  info: '#0ea5e9',
  infoSoft: '#e0f2fe',
  purple: '#8b5cf6',
  purpleSoft: '#f5f3ff',
  orange: '#f97316',
  orangeSoft: '#fff7ed',
  teal: '#14b8a6',
  tealSoft: '#f0fdfa',
  text: '#14532d',
  textSecondary: '#4b7c5f',
  textMuted: '#86a897',
  bg: '#f0fdf4',
  surface: '#ffffff',
  border: '#d1fae5',
  white: '#ffffff',
} as const;

export const gradients = {
  header: [colors.primary, colors.primarySoft, '#15803d'] as const,
  landing: [colors.primary, colors.primarySoft, colors.primaryLight] as const,
  profile: [colors.primary, colors.primarySoft, '#15803d'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  /** Matches xl visually today; kept for semantic chip/button usage. */
  pill: 20,
  round: 999,
} as const;

export const typography = {
  screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '800' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
};

export const shadows = {
  card: {
    shadowColor: '#052e16',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
} as const;

export const toneColors = {
  neutral: { bg: colors.surface, text: colors.textSecondary, border: colors.border },
  success: { bg: colors.primaryPale, text: colors.primarySoft, border: colors.border },
  urgent: { bg: colors.accentSoft, text: colors.accent, border: 'rgba(239,68,68,0.18)' },
  warning: { bg: colors.warningSoft, text: '#b45309', border: 'rgba(245,158,11,0.2)' },
  info: { bg: colors.infoSoft, text: colors.info, border: 'rgba(14,165,233,0.18)' },
  purple: { bg: colors.purpleSoft, text: colors.purple, border: 'rgba(139,92,246,0.18)' },
  teal: { bg: colors.tealSoft, text: colors.teal, border: 'rgba(20,184,166,0.18)' },
  orange: { bg: colors.orangeSoft, text: colors.orange, border: 'rgba(249,115,22,0.18)' },
} as const;
