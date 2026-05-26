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
  /** Matches xl visually today; kept for semantic chip/button usage. */
  pill: 20,
  round: 999,
} as const;
