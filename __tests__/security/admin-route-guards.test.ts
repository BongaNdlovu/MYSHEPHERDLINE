import { describe, expect, it } from 'vitest';

import {
  canRenderAdminLayout,
  canRenderOwnerRouteContent,
  shouldRedirectFromAdminLayout,
  shouldRedirectFromOwnerRoute,
} from '@/features/admin/selectors/route-guards';

describe('OwnerRoute auth gating', () => {
  it('blocks protected content while auth is loading', () => {
    expect(canRenderOwnerRouteContent({ loading: true, isOwner: true })).toBe(false);
    expect(canRenderOwnerRouteContent({ loading: true, isOwner: false })).toBe(false);
    expect(shouldRedirectFromOwnerRoute({ loading: true, isOwner: false })).toBe(false);
  });

  it('redirects non-owners after auth resolves', () => {
    expect(shouldRedirectFromOwnerRoute({ loading: false, isOwner: false })).toBe(true);
    expect(canRenderOwnerRouteContent({ loading: false, isOwner: false })).toBe(false);
  });

  it('allows owners after auth resolves', () => {
    expect(shouldRedirectFromOwnerRoute({ loading: false, isOwner: true })).toBe(false);
    expect(canRenderOwnerRouteContent({ loading: false, isOwner: true })).toBe(true);
  });
});

describe('AdminLayout auth gating', () => {
  it('blocks the admin stack while auth is loading', () => {
    expect(canRenderAdminLayout({ loading: true, isAdmin: true, onUnauthorizedScreen: false })).toBe(
      false,
    );
    expect(
      shouldRedirectFromAdminLayout({ loading: true, isAdmin: false, onUnauthorizedScreen: false }),
    ).toBe(false);
  });

  it('allows the unauthorized screen during loading', () => {
    expect(canRenderAdminLayout({ loading: true, isAdmin: false, onUnauthorizedScreen: true })).toBe(
      true,
    );
  });

  it('redirects non-admins after auth resolves', () => {
    expect(
      shouldRedirectFromAdminLayout({ loading: false, isAdmin: false, onUnauthorizedScreen: false }),
    ).toBe(true);
    expect(canRenderAdminLayout({ loading: false, isAdmin: false, onUnauthorizedScreen: false })).toBe(
      false,
    );
  });

  it('allows admins after auth resolves', () => {
    expect(
      shouldRedirectFromAdminLayout({ loading: false, isAdmin: true, onUnauthorizedScreen: false }),
    ).toBe(false);
    expect(canRenderAdminLayout({ loading: false, isAdmin: true, onUnauthorizedScreen: false })).toBe(
      true,
    );
  });
});
