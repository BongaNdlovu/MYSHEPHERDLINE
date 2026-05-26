import { describe, expect, it } from 'vitest';

import { hasFieldErrors, validateSignIn, validateSignUp, validateVisitLog } from '@/lib/core/validation';

describe('validation', () => {
  it('requires sign-in fields', () => {
    const errors = validateSignIn({ email: '', password: '' });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(hasFieldErrors(errors)).toBe(true);
  });

  it('validates email format on sign-in', () => {
    const errors = validateSignIn({ email: 'not-an-email', password: 'secret123' });
    expect(errors.email).toContain('valid email');
    expect(errors.password).toBeUndefined();
  });

  it('requires sign-up display name', () => {
    const errors = validateSignUp({ displayName: 'A', email: 'user@example.com', password: 'secret123' });
    expect(errors.displayName).toContain('2 characters');
  });

  it('blocks visit logging without auth context', () => {
    expect(validateVisitLog({ memberPresent: true, userPresent: false })).toContain('Sign in');
    expect(validateVisitLog({ memberPresent: false, userPresent: true })).toContain('valid member');
    expect(validateVisitLog({ memberPresent: true, userPresent: true })).toBeUndefined();
  });
});
