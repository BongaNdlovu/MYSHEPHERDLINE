import { describe, expect, it } from 'vitest';

import { validateAppEnv } from '@/lib/core/env';

describe('validateAppEnv', () => {
  it('fails when required keys are missing', () => {
    const result = validateAppEnv({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain('EXPO_PUBLIC_SUPABASE_URL');
    }
  });

  it('rejects placeholder credentials', () => {
    const result = validateAppEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'real-key',
    });
    expect(result.ok).toBe(false);
  });

  it('accepts valid credentials', () => {
    const result = validateAppEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      EXPO_PUBLIC_WORKER_API_URL: 'https://worker.example.dev',
    });
    expect(result.ok).toBe(true);
  });
});
