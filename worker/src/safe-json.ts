export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: 'Response could not be serialized' });
  }
}

export function safeLogPayload(payload: Record<string, unknown>): string {
  return safeStringify(payload);
}
