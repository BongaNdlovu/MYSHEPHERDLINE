import { describe, expect, it } from 'vitest';

import {
  isAppAdmin,
  isOperationalAdmin,
  isOwner,
  isProfileActive,
  normalizeEmail,
} from '@/lib/core/admin';
import type { Profile } from '@/types/database';

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '1',
    organization_id: 'a0000000-0000-4000-8000-000000000001',
    email: 'owner@example.com',
    display_name: 'Owner',
    role: 'owner',
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('isOwner', () => {
  it('allows owner role', () => {
    expect(isOwner(profile())).toBe(true);
  });

  it('blocks admin and shepherd roles', () => {
    expect(isOwner(profile({ role: 'admin' }))).toBe(false);
    expect(isOwner(profile({ role: 'shepherd' }))).toBe(false);
  });

  it('blocks inactive owner', () => {
    expect(isOwner(profile({ is_active: false }))).toBe(false);
  });
});

describe('isOperationalAdmin', () => {
  it('allows owner and admin roles', () => {
    expect(isOperationalAdmin(profile({ role: 'owner' }))).toBe(true);
    expect(isOperationalAdmin(profile({ role: 'admin', email: 'ops@example.com' }))).toBe(true);
  });

  it('blocks shepherd role', () => {
    expect(isOperationalAdmin(profile({ role: 'shepherd' }))).toBe(false);
  });

  it('blocks inactive admins', () => {
    expect(isOperationalAdmin(profile({ role: 'admin', is_active: false }))).toBe(false);
  });
});

describe('isAppAdmin', () => {
  it('matches isOperationalAdmin', () => {
    expect(isAppAdmin(profile({ role: 'admin', email: 'ops@example.com' }))).toBe(true);
    expect(isAppAdmin(profile({ role: 'shepherd' }))).toBe(false);
  });
});

describe('isProfileActive', () => {
  it('treats missing profile as inactive', () => {
    expect(isProfileActive(null)).toBe(false);
  });

  it('requires explicit active state', () => {
    expect(isProfileActive(profile({ is_active: false }))).toBe(false);
    expect(isProfileActive(profile({ is_active: true }))).toBe(true);
    expect(isProfileActive(profile({ is_active: undefined as never }))).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  Test@Mail.COM ')).toBe('test@mail.com');
  });
});
