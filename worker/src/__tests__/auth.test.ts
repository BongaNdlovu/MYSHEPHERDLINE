import { describe, expect, it } from 'vitest';

import { hasGlobalScope, isInternalDigestRequest, isOwner, isValidExpoPushToken } from '../auth';

describe('worker auth helpers', () => {
  it('validates expo push token format', () => {
    expect(isValidExpoPushToken('ExpoPushToken[abc123]')).toBe(true);
    expect(isValidExpoPushToken('invalid')).toBe(false);
  });

  it('detects internal digest secret', () => {
    const request = new Request('https://example.dev/notifications/send-digest', {
      headers: { 'X-Cron-Secret': 'secret-value' },
    });
    expect(isInternalDigestRequest(request, { DIGEST_CRON_SECRET: 'secret-value' } as never)).toBe(true);
  });

  it('checks global scope for admin and owner', () => {
    expect(
      hasGlobalScope({
        userId: '1',
        organizationId: 'org-1',
        role: 'admin',
        email: 'a@x.com',
        isActive: true,
      }),
    ).toBe(true);
    expect(
      hasGlobalScope({
        userId: '1',
        organizationId: 'org-1',
        role: 'owner',
        email: 'o@x.com',
        isActive: true,
      }),
    ).toBe(true);
    expect(
      hasGlobalScope({
        userId: '1',
        organizationId: 'org-1',
        role: 'shepherd',
        email: 's@x.com',
        isActive: true,
      }),
    ).toBe(false);
  });

  it('checks owner role', () => {
    expect(
      isOwner({
        userId: '1',
        organizationId: 'org-1',
        role: 'owner',
        email: 'o@x.com',
        isActive: true,
      }),
    ).toBe(true);
    expect(
      isOwner({
        userId: '1',
        organizationId: 'org-1',
        role: 'admin',
        email: 'a@x.com',
        isActive: true,
      }),
    ).toBe(false);
  });
});
