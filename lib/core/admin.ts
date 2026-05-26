import type { Profile } from '@/types/database';

/** Primary admin account for v1 — must also have profile.role = 'admin'. */
export const PRIMARY_ADMIN_EMAIL = 'Fanelesibonge50@gmail.com';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** App-level admin gate: database role plus designated email. */
export function isAppAdmin(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role !== 'admin') return false;
  return normalizeEmail(profile.email) === normalizeEmail(PRIMARY_ADMIN_EMAIL);
}

export function isProfileActive(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return profile.is_active !== false;
}
