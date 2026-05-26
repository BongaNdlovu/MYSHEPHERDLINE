import { describe, expect, it } from 'vitest';

import {
  createAppError,
  fromAuthError,
  fromHttpStatus,
  fromSupabaseError,
  getUserMessage,
  isAppError,
  toAppError,
} from '@/lib/core/errors';

describe('errors', () => {
  it('creates retryable network errors by default', () => {
    const error = createAppError('network');
    expect(error.retryable).toBe(true);
    expect(error.message).toContain('connection');
  });

  it('maps supabase auth failures', () => {
    const error = fromSupabaseError({ message: 'JWT expired', status: 401, code: '401' });
    expect(error.category).toBe('auth');
    expect(error.retryable).toBe(false);
  });

  it('maps supabase forbidden failures', () => {
    const error = fromSupabaseError({ message: 'permission denied', code: '42501', status: 403 });
    expect(error.category).toBe('forbidden');
  });

  it('maps supabase not found failures', () => {
    const error = fromSupabaseError({ message: 'not found', code: 'PGRST116' });
    expect(error.category).toBe('not_found');
  });

  it('maps auth sign-in failures to friendly copy', () => {
    const error = fromAuthError({ message: 'Invalid login credentials' });
    expect(error?.message).toBe('Email or password is incorrect.');
  });

  it('maps http status codes', () => {
    expect(fromHttpStatus(401).category).toBe('auth');
    expect(fromHttpStatus(403).category).toBe('forbidden');
    expect(fromHttpStatus(404).category).toBe('not_found');
    expect(fromHttpStatus(503).category).toBe('server');
  });

  it('normalizes unknown thrown values', () => {
    const error = toAppError(new Error('network request failed'), 'Unable to load members.');
    expect(error.category).toBe('network');
    expect(getUserMessage(error)).toContain('Unable to load members');
  });

  it('preserves existing app errors', () => {
    const original = createAppError('validation', 'Email is required.', { field: 'email' });
    expect(toAppError(original)).toBe(original);
    expect(isAppError(original)).toBe(true);
  });
});
