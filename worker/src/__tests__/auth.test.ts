import { describe, expect, it } from 'vitest';

import { isAdmin, isInternalDigestRequest, isValidExpoPushToken } from '../auth';

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

  it('checks admin role', () => {
    expect(isAdmin({ userId: '1', role: 'admin' })).toBe(true);
    expect(isAdmin({ userId: '1', role: 'shepherd' })).toBe(false);
  });
});
