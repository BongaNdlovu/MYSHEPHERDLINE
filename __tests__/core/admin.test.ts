import { describe, expect, it } from 'vitest';

import { isAppAdmin, isProfileActive, normalizeEmail, PRIMARY_ADMIN_EMAIL } from '@/lib/core/admin';
import type { Profile } from '@/types/database';

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '1',
    email: PRIMARY_ADMIN_EMAIL,
    display_name: 'Admin',
    role: 'admin',
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('isAppAdmin', () => {
  it('allows primary admin email with admin role', () => {
    expect(isAppAdmin(profile())).toBe(true);
  });

  it('blocks admin role with wrong email', () => {
    expect(isAppAdmin(profile({ email: 'other@example.com' }))).toBe(false);
  });

  it('blocks correct email with shepherd role', () => {
    expect(isAppAdmin(profile({ role: 'shepherd' }))).toBe(false);
  });

  it('is case-insensitive for email', () => {
    expect(isAppAdmin(profile({ email: 'fanelesibonge50@gmail.com' }))).toBe(true);
  });
});

describe('isProfileActive', () => {
  it('treats missing profile as inactive', () => {
    expect(isProfileActive(null)).toBe(false);
  });

  it('respects is_active flag', () => {
    expect(isProfileActive(profile({ is_active: false }))).toBe(false);
    expect(isProfileActive(profile({ is_active: true }))).toBe(true);
  });
});

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  Test@Mail.COM ')).toBe('test@mail.com');
  });
});
