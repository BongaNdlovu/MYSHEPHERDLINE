import { describe, expect, it } from 'vitest';

import { testIds } from '@/constants/testIds';

describe('admin flow test IDs', () => {
  it('exposes admin entry and guard screens', () => {
    expect(testIds.admin.entry).toBe('admin-entry');
    expect(testIds.admin.center).toBe('admin-center');
    expect(testIds.admin.unauthorized).toBe('admin-unauthorized');
  });

  it('exposes admin module menus', () => {
    expect(testIds.admin.menu('users')).toBe('admin-menu-users');
    expect(testIds.admin.menu('congregations')).toBe('admin-menu-congregations');
    expect(testIds.admin.members.screen).toBe('admin-members-screen');
    expect(testIds.admin.tasks.screen).toBe('admin-tasks-screen');
  });

  it('removes public sign-up CTA from landing test IDs', () => {
    expect(testIds.landing.accessNote).toBe('landing-access-note');
    expect('signUp' in testIds.landing).toBe(false);
  });
});
