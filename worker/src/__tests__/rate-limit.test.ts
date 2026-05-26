import { beforeEach, describe, expect, it } from 'vitest';

import { isRateLimited, resetMemoryRateLimits } from '../rate-limit';

describe('rate limiting', () => {
  beforeEach(() => {
    resetMemoryRateLimits();
  });

  it('allows requests under the memory limit', async () => {
    await expect(isRateLimited('client-a', { maxRequests: 2, windowMs: 60_000 })).resolves.toBe(false);
    await expect(isRateLimited('client-a', { maxRequests: 2, windowMs: 60_000 })).resolves.toBe(false);
  });

  it('blocks requests over the memory limit', async () => {
    await isRateLimited('client-b', { maxRequests: 1, windowMs: 60_000 });
    await expect(isRateLimited('client-b', { maxRequests: 1, windowMs: 60_000 })).resolves.toBe(true);
  });

  it('uses KV when provided', async () => {
    const store = new Map<string, string>();
    const kv = {
      get: async (key: string) => store.get(key) ?? null,
      put: async (key: string, value: string, options?: { expirationTtl?: number }) => {
        if (options?.expirationTtl !== undefined && options.expirationTtl < 60) {
          throw new Error('KV TTL must be at least 60 seconds');
        }
        store.set(key, value);
      },
    } as KVNamespace;

    await expect(isRateLimited('client-kv', { kv, maxRequests: 1, windowMs: 60_000 })).resolves.toBe(
      false,
    );
    await expect(isRateLimited('client-kv', { kv, maxRequests: 1, windowMs: 60_000 })).resolves.toBe(
      true,
    );
  });
});
