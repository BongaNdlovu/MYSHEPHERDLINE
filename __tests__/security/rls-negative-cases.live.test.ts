import { describe, expect, it } from 'vitest';

import { resolveRlsLiveConfig, runRlsNegativeCases } from '../../scripts/lib/rls-negative-cases.mjs';

const liveEnabled = process.env.RLS_LIVE_TESTS === '1';
const config = resolveRlsLiveConfig();

describe.skipIf(!liveEnabled || !config.ready)(
  'RLS negative paths against live Supabase',
  () => {
    it('denies push-token reads, spoofed visit inserts, member deletes, and cross-assignee reads', async () => {
      const result = await runRlsNegativeCases(config);
      expect(result.failures).toEqual([]);
      expect(result.ok).toBe(true);
    }, 60_000);
  },
);

describe('RLS live test gate', () => {
  it('documents how to enable live Supabase denial checks', () => {
    if (liveEnabled && config.ready) {
      expect(true).toBe(true);
      return;
    }

    expect(liveEnabled ? config.reason : 'Set RLS_LIVE_TESTS=1 to run live RLS denial checks.').toBeTruthy();
  });
});
