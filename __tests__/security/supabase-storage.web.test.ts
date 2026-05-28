import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

describe('supabase auth storage (web)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stores and retrieves values in memory', async () => {
    const { supabaseAuthStorage } = await import('@/lib/core/supabase-storage');
    supabaseAuthStorage.setItem('auth-token', '{"access_token":"abc"}');
    expect(supabaseAuthStorage.getItem('auth-token')).toBe('{"access_token":"abc"}');
  });

  it('clears stored values on remove', async () => {
    const { supabaseAuthStorage } = await import('@/lib/core/supabase-storage');
    supabaseAuthStorage.setItem('auth-token', 'value');
    supabaseAuthStorage.removeItem('auth-token');
    expect(supabaseAuthStorage.getItem('auth-token')).toBeNull();
  });

  it('never accesses localStorage', async () => {
    const localStorageMock = {
      getItem: vi.fn(() => {
        throw new Error('localStorage.getItem should not be called');
      }),
      setItem: vi.fn(() => {
        throw new Error('localStorage.setItem should not be called');
      }),
      removeItem: vi.fn(() => {
        throw new Error('localStorage.removeItem should not be called');
      }),
    };
    vi.stubGlobal('localStorage', localStorageMock);

    const { supabaseAuthStorage } = await import('@/lib/core/supabase-storage');
    supabaseAuthStorage.setItem('auth-token', 'value');
    supabaseAuthStorage.getItem('auth-token');
    supabaseAuthStorage.removeItem('auth-token');

    expect(localStorageMock.getItem).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
