import { describe, expect, it } from 'vitest';

import { validateAppEnv } from '@/lib/core/env';

describe('production configuration guardrails', () => {
  it('rejects missing env keys', () => {
    const result = validateAppEnv({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing.length).toBeGreaterThan(0);
    }
  });

  it('rejects placeholder credentials', () => {
    const result = validateAppEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'real-key',
    });
    expect(result.ok).toBe(false);
  });
});
