import { describe, expect, it } from 'vitest';

import { safeLogPayload, safeStringify } from '../safe-json';

describe('safe json helpers', () => {
  it('stringifies regular payloads', () => {
    expect(safeStringify({ ok: true })).toBe('{"ok":true}');
  });

  it('handles circular payloads without throwing', () => {
    const payload: Record<string, unknown> = { level: 'audit' };
    payload.self = payload;
    expect(safeStringify(payload)).toBe('{"error":"Response could not be serialized"}');
    expect(safeLogPayload(payload)).toBe('{"error":"Response could not be serialized"}');
  });
});
