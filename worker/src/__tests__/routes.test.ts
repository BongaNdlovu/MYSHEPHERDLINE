import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  resolveAuth: vi.fn(),
  createServiceClient: vi.fn(),
  isOwner: vi.fn(),
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
    authMocks.isOwner.mockReturnValue(false);
    authMocks.isInternalDigestRequest.mockReturnValue(false);
  });

  it('returns health without auth', async () => {
    const response = await worker.fetch(new Request('https://worker.test/health'), env);
    expect(response.status).toBe(200);
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
      role: 'shepherd',
      email: 's@test.local',
      isActive: true,
    });
    const response = await worker.fetch(
      new Request('https://worker.test/reports/summary', {
        headers: { Authorization: 'Bearer token' },
      }),
      env,
    );
    expect(response.status).toBe(200);
    expect(reportMocks.buildSummary).toHaveBeenCalled();
  });

  it('rejects digest send for non-owner users', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      role: 'admin',
      email: 'a@test.local',
      isActive: true,
    });
    authMocks.isOwner.mockReturnValue(false);
    const response = await worker.fetch(
      new Request('https://worker.test/notifications/send-digest', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      }),
      env,
    );
    expect(response.status).toBe(403);
  });

  it('allows digest send for owner users', async () => {
    authMocks.resolveAuth.mockResolvedValue({
      userId: 'u1',
      role: 'owner',
      email: 'o@test.local',
      isActive: true,
    });
    authMocks.isOwner.mockReturnValue(true);
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
});
