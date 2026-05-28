import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  resolveAuth: vi.fn(),
  createServiceClient: vi.fn(),
  isInternalDigestRequest: vi.fn(),
}));

const reportMocks = vi.hoisted(() => ({
  buildSummary: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  parseRegisterPayload: vi.fn(),
  registerToken: vi.fn(),
  sendDigest: vi.fn(),
  sendTaskReminders: vi.fn(),
}));

const provisioningMocks = vi.hoisted(() => ({
  parseInvitePayload: vi.fn(),
  inviteAccessRequest: vi.fn(),
}));

const rateLimitStore = vi.hoisted(() => new Map<string, string>());

vi.mock('../auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth')>();
  return {
    ...actual,
    resolveAuth: authMocks.resolveAuth,
    createServiceClient: authMocks.createServiceClient,
    isInternalDigestRequest: authMocks.isInternalDigestRequest,
  };
});
vi.mock('../reports', () => reportMocks);
vi.mock('../notifications', () => notificationMocks);
vi.mock('../provisioning', () => provisioningMocks);

const env = {
  SUPABASE_URL: 'https://abc.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  RECENT_ACTIVITY_DAYS: '7',
  DIGEST_CRON_SECRET: 'cron-secret',
  ALLOWED_ORIGINS: 'https://app.test',
  RATE_LIMIT: {
    get: async (key: string) => rateLimitStore.get(key) ?? null,
    put: async (key: string, value: string) => {
      rateLimitStore.set(key, value);
    },
    list: async () => ({ keys: [], list_complete: true, cursor: '' }),
    getWithMetadata: async () => ({ value: null, metadata: null }),
    delete: async () => undefined,
  } as unknown as KVNamespace,
} as const;

describe('worker routes', () => {
  let worker: typeof import('../index').default;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    worker = (await import('../index')).default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitStore.clear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    authMocks.createServiceClient.mockReturnValue({});
    reportMocks.buildSummary.mockResolvedValue({ tasksOpen: 1 });
    notificationMocks.parseRegisterPayload.mockReturnValue({
      expoPushToken: 'ExpoPushToken[abc]',
      deviceName: 'Pixel',
    });
    notificationMocks.registerToken.mockResolvedValue({ ok: true });
    notificationMocks.sendDigest.mockResolvedValue({ sent: 1, organizations: 1, results: [] });
    notificationMocks.sendTaskReminders.mockResolvedValue({ sent: 2, tasks: 1, marked: 1 });
    provisioningMocks.parseInvitePayload.mockReturnValue({ accessRequestId: 'req-1' });
    provisioningMocks.inviteAccessRequest.mockResolvedValue({ ok: true, email: 'shepherd@test.local' });
    authMocks.isInternalDigestRequest.mockReturnValue(false);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('returns health without auth', async () => {
    const response = await worker.fetch(new Request('https://worker.test/health'), env);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('returns health for HEAD without auth', async () => {
    const response = await worker.fetch(new Request('https://worker.test/health', { method: 'HEAD' }), env);
    expect(response.status).toBe(200);
  });

  it('rejects unauthenticated report requests', async () => {
    authMocks.resolveAuth.mockResolvedValue({ status: 'unauthorized' });
    const response = await worker.fetch(new Request('https://worker.test/reports/summary'), env);
    expect(response.status).toBe(401);
  });

  it('rejects inactive users', async () => {
    authMocks.resolveAuth.mockResolvedValue({ status: 'inactive', userId: 'u1' });
    const response = await worker.fetch(
      new Request('https://worker.test/reports/summary', {
        headers: { Authorization: 'Bearer token' },
      }),
      env,
    );
    expect(response.status).toBe(403);
  });

  it('returns summary for authenticated users', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'shepherd',
      email: 's@test.local',
      isActive: true,
    });
    const response = await worker.fetch(
      new Request('https://worker.test/reports/summary', {
        headers: { Authorization: 'Bearer token', Origin: 'https://app.test' },
      }),
      env,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Vary')).toBe('Origin');
    expect(reportMocks.buildSummary).toHaveBeenCalled();
  });

  it('returns sanitized JSON when buildSummary throws', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'shepherd',
      email: 's@test.local',
      isActive: true,
    });
    reportMocks.buildSummary.mockRejectedValue(new Error('summary exploded'));

    const response = await worker.fetch(
      new Request('https://worker.test/reports/summary', {
        headers: { Authorization: 'Bearer token', Origin: 'https://app.test' },
      }),
      env,
    );

    expect(response.status).toBe(500);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.test');
    expect(response.headers.get('X-Request-Id')).toBeTruthy();
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
  });

  it('returns sanitized JSON when sendDigest throws', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'owner',
      email: 'o@test.local',
      isActive: true,
    });
    notificationMocks.sendDigest.mockRejectedValue(new Error('digest exploded'));

    const response = await worker.fetch(
      new Request('https://worker.test/notifications/send-digest', {
        method: 'POST',
        headers: { Authorization: 'Bearer token', Origin: 'https://app.test' },
      }),
      env,
    );

    expect(response.status).toBe(500);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.test');
    expect(response.headers.get('X-Request-Id')).toBeTruthy();
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
  });

  it('rejects digest send for non-owner users using real isOwner logic', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'admin',
      email: 'a@test.local',
      isActive: true,
    });
    const response = await worker.fetch(
      new Request('https://worker.test/notifications/send-digest', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      }),
      env,
    );
    expect(response.status).toBe(403);
    expect(notificationMocks.sendDigest).not.toHaveBeenCalled();
  });

  it('allows digest send for owner users using real isOwner logic', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'owner',
      email: 'o@test.local',
      isActive: true,
    });
    const response = await worker.fetch(
      new Request('https://worker.test/notifications/send-digest', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      }),
      env,
    );
    expect(response.status).toBe(200);
    expect(notificationMocks.sendDigest).toHaveBeenCalled();
  });

  it('allows digest send with cron secret', async () => {
    authMocks.isInternalDigestRequest.mockReturnValue(true);
    const response = await worker.fetch(
      new Request('https://worker.test/notifications/send-digest', {
        method: 'POST',
        headers: { 'X-Cron-Secret': 'cron-secret' },
      }),
      env,
    );
    expect(response.status).toBe(200);
    expect(notificationMocks.sendDigest).toHaveBeenCalled();
  });

  it('rejects invalid register payloads', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'shepherd',
      email: 's@test.local',
      isActive: true,
    });
    notificationMocks.parseRegisterPayload.mockReturnValue({ error: 'expoPushToken is required' });
    const response = await worker.fetch(
      new Request('https://worker.test/notifications/register', {
        method: 'POST',
        headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      env,
    );
    expect(response.status).toBe(400);
  });

  it('allows task reminders send for owner users', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'owner',
      email: 'o@test.local',
      isActive: true,
    });
    const response = await worker.fetch(
      new Request('https://worker.test/notifications/send-reminders', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      }),
      env,
    );
    expect(response.status).toBe(200);
    expect(notificationMocks.sendTaskReminders).toHaveBeenCalled();
  });

  it('sends access-request invites for admin users', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'admin',
      email: 'a@test.local',
      isActive: true,
    });
    const response = await worker.fetch(
      new Request('https://worker.test/admin/access-requests/invite', {
        method: 'POST',
        headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessRequestId: 'req-1' }),
      }),
      env,
    );
    expect(response.status).toBe(200);
    expect(provisioningMocks.inviteAccessRequest).toHaveBeenCalled();
  });

  it('rejects oversized register payloads', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org-1',
      role: 'shepherd',
      email: 's@test.local',
      isActive: true,
    });
    const response = await worker.fetch(
      new Request('https://worker.test/notifications/register', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
          'Content-Length': String(17 * 1024),
        },
        body: JSON.stringify({ expoPushToken: 'ExpoPushToken[abc]' }),
      }),
      env,
    );
    expect(response.status).toBe(413);
    expect(notificationMocks.registerToken).not.toHaveBeenCalled();
  });

  it('returns 405 for a valid path with the wrong method', async () => {
    const response = await worker.fetch(new Request('https://worker.test/reports/summary', { method: 'DELETE' }), env);
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET');
  });

  it('does not leak missing env names in the client response', async () => {
    const response = await worker.fetch(
      new Request('https://worker.test/reports/summary'),
      { ...env, RATE_LIMIT: undefined } as never,
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
  });

  it('runs the daily digest cron only for the digest schedule', async () => {
    await worker.scheduled({ cron: '0 8 * * *' } as ScheduledEvent, env);

    expect(notificationMocks.sendDigest).toHaveBeenCalledTimes(1);
    expect(notificationMocks.sendTaskReminders).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('runs the reminder cron only for the reminder schedule', async () => {
    await worker.scheduled({ cron: '*/15 * * * *' } as ScheduledEvent, env);

    expect(notificationMocks.sendTaskReminders).toHaveBeenCalledTimes(1);
    expect(notificationMocks.sendDigest).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('logs unknown schedules without triggering notification jobs', async () => {
    await worker.scheduled({ cron: '1 2 3 4 5' } as ScheduledEvent, env);

    expect(notificationMocks.sendDigest).not.toHaveBeenCalled();
    expect(notificationMocks.sendTaskReminders).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"cron_unknown_schedule"'));
  });

  it('does not run scheduled jobs when the cron secret is missing', async () => {
    await worker.scheduled({ cron: '0 8 * * *' } as ScheduledEvent, {
      ...env,
      DIGEST_CRON_SECRET: '',
    });

    expect(notificationMocks.sendDigest).not.toHaveBeenCalled();
    expect(notificationMocks.sendTaskReminders).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"cron_secret_missing"'));
  });

  it('does not run scheduled jobs when the worker env is misconfigured', async () => {
    await worker.scheduled({ cron: '0 8 * * *' } as ScheduledEvent, {
      ...env,
      RATE_LIMIT: undefined,
    } as never);

    expect(notificationMocks.sendDigest).not.toHaveBeenCalled();
    expect(notificationMocks.sendTaskReminders).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"cron_misconfigured"'));
  });
});
