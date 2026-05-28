import { describe, expect, it, vi } from 'vitest';

import { runEnvironmentCheck } from '@/scripts/check-env.mjs';

function createConsole() {
  const lines: string[] = [];
  return {
    lines,
    log(message: string) {
      lines.push(message);
    },
  } as unknown as Console & { lines: string[] };
}

const successfulFetch: typeof fetch = async (input) => {
  const url = String(input);
  if (url.endsWith('/auth/v1/health')) {
    return { ok: true, status: 200 } as Response;
  }
  if (url.endsWith('/rest/v1/')) {
    return { ok: false, status: 401 } as Response;
  }
  if (url.endsWith('/health')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'healthy' }),
    } as Response;
  }
  throw new Error(`Unexpected URL ${url}`);
};

describe('check-env script', () => {
  it('fails the production gate when report fallback is enabled', async () => {
    const consoleImpl = createConsole();

    const exitCode = await runEnvironmentCheck({
      cwd: 'C:/tmp/myshepherdline',
      argv: ['--production'],
      env: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
        EXPO_PUBLIC_WORKER_API_URL: 'https://worker.example.com',
        EXPO_PUBLIC_LEGAL_REVIEW_COMPLETE: 'true',
        EXPO_PUBLIC_MONITORING_ENABLED: 'true',
        EXPO_PUBLIC_SENTRY_DSN: 'https://dsn.example.com/1',
        EXPO_PUBLIC_ALLOW_REPORT_FALLBACK: 'true',
      } as unknown as NodeJS.ProcessEnv,
      fetchImpl: successfulFetch,
      consoleImpl,
      fileExists: vi.fn().mockReturnValue(false),
    });

    expect(exitCode).toBe(1);
    expect(consoleImpl.lines.join('\n')).toContain(
      'EXPO_PUBLIC_ALLOW_REPORT_FALLBACK must be unset for production',
    );
  });

  it('passes the production gate when required production vars are present', async () => {
    const consoleImpl = createConsole();

    const exitCode = await runEnvironmentCheck({
      cwd: 'C:/tmp/myshepherdline',
      argv: ['--production'],
      env: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
        EXPO_PUBLIC_WORKER_API_URL: 'https://worker.example.com',
        EXPO_PUBLIC_LEGAL_REVIEW_COMPLETE: 'true',
        EXPO_PUBLIC_MONITORING_ENABLED: 'true',
        EXPO_PUBLIC_SENTRY_DSN: 'https://dsn.example.com/1',
      } as unknown as NodeJS.ProcessEnv,
      fetchImpl: successfulFetch,
      consoleImpl,
      fileExists: vi.fn().mockReturnValue(false),
    });

    expect(exitCode).toBe(0);
    expect(consoleImpl.lines.join('\n')).toContain('Report fallback disabled for production');
    expect(consoleImpl.lines.join('\n')).toContain('Worker health: healthy');
  });
});
