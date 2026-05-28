import { describe, expect, it } from 'vitest';

import { getRecentActivityDays, validateWorkerEnv } from '../env';

describe('worker env helpers', () => {
  it('defaults missing recent activity days to 7', () => {
    expect(getRecentActivityDays({} as never)).toBe(7);
  });

  it('allows intentionally zero recent activity days', () => {
    expect(getRecentActivityDays({ RECENT_ACTIVITY_DAYS: '0' } as never)).toBe(0);
  });

  it('falls back invalid values to 7', () => {
    expect(getRecentActivityDays({ RECENT_ACTIVITY_DAYS: 'not-a-number' } as never)).toBe(7);
  });

  it('requires the rate-limit binding', () => {
    expect(
      validateWorkerEnv({
        SUPABASE_URL: 'https://abc.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      } as never),
    ).toContain('RATE_LIMIT');
  });
});
