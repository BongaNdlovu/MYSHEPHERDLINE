import { describe, expect, it } from 'vitest';

import { shouldRegisterPushForSession } from '@/lib/core/push-registration';

describe('shouldRegisterPushForSession', () => {
  it('registers when a signed-in user has not been registered yet', () => {
    expect(
      shouldRegisterPushForSession({
        userId: 'user-1',
        accessToken: 'token-1',
        lastRegisteredUserId: null,
        inFlightUserId: null,
      }),
    ).toBe(true);
  });

  it('skips registration when the same user was already registered', () => {
    expect(
      shouldRegisterPushForSession({
        userId: 'user-1',
        accessToken: 'token-2',
        lastRegisteredUserId: 'user-1',
        inFlightUserId: null,
      }),
    ).toBe(false);
  });

  it('skips registration while the same user is already in flight', () => {
    expect(
      shouldRegisterPushForSession({
        userId: 'user-1',
        accessToken: 'token-1',
        lastRegisteredUserId: null,
        inFlightUserId: 'user-1',
      }),
    ).toBe(false);
  });
});
