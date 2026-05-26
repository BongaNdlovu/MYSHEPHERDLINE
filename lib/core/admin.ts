import type { Profile, UserRole } from '@/types/database';

/** Single owner account — must have profile.role = 'owner'. */
export const OWNER_EMAIL = 'Fanelesibonge50@gmail.com';

/** @deprecated Use OWNER_EMAIL */
export const PRIMARY_ADMIN_EMAIL = OWNER_EMAIL;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isOwner(profile: Profile | null | undefined): boolean {
  if (!profile || !isProfileActive(profile)) return false;
  return profile.role === 'owner';
}

/** Operational admins manage members, tasks, and reports (admin or owner). */
export function isOperationalAdmin(profile: Profile | null | undefined): boolean {
  if (!profile || !isProfileActive(profile)) return false;
  return profile.role === 'admin' || profile.role === 'owner';
}

/** @deprecated Use isOperationalAdmin */
export function isAppAdmin(profile: Profile | null | undefined): boolean {
  return isOperationalAdmin(profile);
}

export function isProfileActive(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return profile.is_active !== false;
}

export function isOwnerRole(role: UserRole): boolean {
  return role === 'owner';
}
