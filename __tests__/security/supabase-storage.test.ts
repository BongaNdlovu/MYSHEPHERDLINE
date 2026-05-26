import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      values.delete(key);
    }),
  };
});

vi.mock('expo-secure-store', () => secureStore);
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

type SupabaseAuthStorage = typeof import('@/lib/core/supabase-storage').supabaseAuthStorage;

describe('supabase auth storage', () => {
  let supabaseAuthStorage: SupabaseAuthStorage;

  beforeAll(async () => {
    supabaseAuthStorage = (await import('@/lib/core/supabase-storage')).supabaseAuthStorage;
  });

  beforeEach(() => {
    secureStore.values.clear();
    vi.clearAllMocks();
  });

  it('stores and retrieves small values directly', async () => {
    await supabaseAuthStorage.setItem('auth-token', '{"access_token":"abc"}');
    await expect(supabaseAuthStorage.getItem('auth-token')).resolves.toBe('{"access_token":"abc"}');
  });

  it('chunks large session payloads for secure store limits', async () => {
    const largeValue = 'x'.repeat(4500);
    await supabaseAuthStorage.setItem('auth-token', largeValue);
    await expect(supabaseAuthStorage.getItem('auth-token')).resolves.toBe(largeValue);
    expect(secureStore.setItemAsync).toHaveBeenCalledWith('auth-token_chunk_count', '3');
  });

  it('clears stored values on remove', async () => {
    await supabaseAuthStorage.setItem('auth-token', 'value');
    await supabaseAuthStorage.removeItem('auth-token');
    await expect(supabaseAuthStorage.getItem('auth-token')).resolves.toBeNull();
  });

  it('keeps the previous session readable if a chunked write is interrupted', async () => {
    const original = 'x'.repeat(4500);
    await supabaseAuthStorage.setItem('auth-token', original);

    secureStore.setItemAsync.mockImplementationOnce(async () => {
      throw new Error('write interrupted');
    });

    await expect(supabaseAuthStorage.setItem('auth-token', 'y'.repeat(4500))).rejects.toThrow(
      'write interrupted',
    );
    await expect(supabaseAuthStorage.getItem('auth-token')).resolves.toBe(original);
  });

  it('uses the shared auth storage key constant', async () => {
    const { SUPABASE_AUTH_STORAGE_KEY } = await import('@/lib/core/supabase-storage');
    expect(SUPABASE_AUTH_STORAGE_KEY).toBe('myshepherdline.auth.session');
  });
});
