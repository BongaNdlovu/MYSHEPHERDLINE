import { describe, expect, it } from 'vitest';

import { parseRegisterPayload } from '../../src/notifications';

describe('notification payload validation', () => {
  it('rejects malformed bodies', () => {
    expect(parseRegisterPayload(null)).toEqual({ error: 'Invalid JSON body' });
    expect(parseRegisterPayload({})).toEqual({ error: 'expoPushToken is required' });
    expect(parseRegisterPayload({ expoPushToken: 'bad' })).toEqual({ error: 'expoPushToken format is invalid' });
  });

  it('accepts valid expo tokens', () => {
    expect(parseRegisterPayload({ expoPushToken: 'ExpoPushToken[abc]', deviceName: 'Pixel 8' })).toEqual({
      expoPushToken: 'ExpoPushToken[abc]',
      deviceName: 'Pixel 8',
    });
  });
});
