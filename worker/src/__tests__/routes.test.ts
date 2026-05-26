import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  createServiceClient: vi.fn(),
  isAdmin: vi.fn(),
  isInternalDigestRequest: vi.fn(),
}));

const reportMocks = vi.hoisted(() => ({
  buildSummary: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  parseRegisterPayload: vi.fn(),
  registerToken: vi.fn(),
  sendDigest: vi.fn(),
}));

vi.mock('../auth', () => authMocks);
vi.mock('../reports', () => reportMocks);
vi.mock('../notifications', () => notificationMocks);

const env = {
  SUPABASE_URL: 'https://abc.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  RECENT_ACTIVITY_DAYS: '7',
  DIGEST_CRON_SECRET: 'cron-secret',
} as const;

describe('worker routes', () => {
  let worker: typeof import('../index').default;

  beforeAll(async () => {
    worker = (await import('../index')).default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.createServiceClient.mockReturnValue({});
    reportMocks.buildSummary.mockResolvedValue({ tasksOpen: 1 });
    notificationMocks.parseRegisterPayload.mockReturnValue({
      expoPushToken: 'ExpoPushToken[abc]',
      deviceName: 'Pixel',
    });
    notificationMocks.registerToken.mockResolvedValue({ ok: true });
    notificationMocks.sendDigest.mockResolvedValue({ sent: 1 });
    authMocks.isAdmin.mockReturnValue(false);
    authMocks.isInternalDigestRequest.mockReturnValue(false);
  });

  it('returns health without auth', async () => {
    const response = await worker.fetch(new Request('https://worker.test/health'), env);
    expect(response.status).toBe(200);
  });

  it('rejects unauthenticated report requests', async () => {
    authMocks.getAuthContext.mockResolvedValue(null);
    const response = await worker.fetch(new Request('https://worker.test/reports/summary'), env);
    expect(response.status).toBe(401);
  });

  it('returns summary for authenticated users', async () => {
    authMocks.getAuthContext.mockResolvedValue({ userId: 'u1', role: 'shepherd' });
    const response = await worker.fetch(
      new Request('https://worker.test/reports/summary', {
        headers: { Authorization: 'Bearer token' },
      }),
      env,
    );
    expect(response.status).toBe(200);
    expect(reportMocks.buildSummary).toHaveBeenCalled();
  });

  it('rejects digest send for non-admin users', async () => {
    authMocks.getAuthContext.mockResolvedValue({ userId: 'u1', role: 'shepherd' });
    const response = await worker.fetch(
      new Request('https://worker.test/notifications/send-digest', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      }),
      env,
    );
    expect(response.status).toBe(403);
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
    authMocks.getAuthContext.mockResolvedValue({ userId: 'u1', role: 'shepherd' });
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
});
