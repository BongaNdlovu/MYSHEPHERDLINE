const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const KV_MIN_TTL_SECONDS = 60;
const KV_MAX_RETRIES = 3;

function kvTtlSeconds(windowMs: number, resetAt?: number) {
  if (resetAt === undefined) return Math.max(KV_MIN_TTL_SECONDS, Math.ceil(windowMs / 1000));
  const remaining = Math.ceil((resetAt - Date.now()) / 1000);
  return Math.max(KV_MIN_TTL_SECONDS, remaining);
}

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimitedMemory(key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS) {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > maxRequests;
}

/**
 * KV rate limiting is best-effort: concurrent requests can race between get/put.
 * Retries reduce but do not eliminate the window. For strict limits, use a Durable Object counter.
 */
async function isRateLimitedKv(
  kv: KVNamespace,
  key: string,
  maxRequests: number,
  windowMs: number,
) {
  const now = Date.now();
  const kvKey = `rl:${key}`;

  for (let attempt = 0; attempt < KV_MAX_RETRIES; attempt += 1) {
    const raw = await kv.get(kvKey);
    let bucket: { count: number; resetAt: number };

    if (!raw) {
      bucket = { count: 1, resetAt: now + windowMs };
      await kv.put(kvKey, JSON.stringify(bucket), {
        expirationTtl: kvTtlSeconds(windowMs),
      });
      return false;
    }

    bucket = JSON.parse(raw) as { count: number; resetAt: number };
    if (bucket.resetAt <= now) {
      bucket = { count: 1, resetAt: now + windowMs };
      await kv.put(kvKey, JSON.stringify(bucket), {
        expirationTtl: kvTtlSeconds(windowMs),
      });
      return false;
    }

    bucket.count += 1;
    await kv.put(kvKey, JSON.stringify(bucket), {
      expirationTtl: kvTtlSeconds(windowMs, bucket.resetAt),
    });

    if (bucket.count <= maxRequests) return false;

    // Re-read once more on a near-limit race and treat as limited if still over threshold.
    const verifyRaw = await kv.get(kvKey);
    if (!verifyRaw) return false;
    const verifyBucket = JSON.parse(verifyRaw) as { count: number; resetAt: number };
    if (verifyBucket.resetAt <= now) return false;
    if (verifyBucket.count > maxRequests) return true;
  }

  return true;
}

export async function isRateLimited(
  key: string,
  options: { kv?: KVNamespace; maxRequests?: number; windowMs?: number } = {},
) {
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const windowMs = options.windowMs ?? WINDOW_MS;

  if (options.kv) {
    return await isRateLimitedKv(options.kv, key, maxRequests, windowMs);
  }
  return isRateLimitedMemory(key, maxRequests, windowMs);
}

export function clientRateLimitKey(request: Request) {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}

/** @internal test helper */
export function resetMemoryRateLimits() {
  memoryBuckets.clear();
}
