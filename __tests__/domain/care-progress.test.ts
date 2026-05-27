import { describe, expect, it } from 'vitest';

import { validateDueAt } from '@/lib/core/validation';

describe('care progress and reminders validation', () => {
  it('accepts ISO due-at values', () => {
    expect(validateDueAt('2026-05-30T14:00')).toBeUndefined();
    expect(validateDueAt('2026-05-30T14:00:00.000Z')).toBeUndefined();
  });

  it('rejects invalid due-at values', () => {
    expect(validateDueAt('not-a-date')).toMatch(/valid date and time/i);
  });
});
