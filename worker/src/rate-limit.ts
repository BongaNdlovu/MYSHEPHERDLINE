const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const KV_MIN_TTL_SECONDS = 60;
const KV_MAX_RETRIES = 3;
const MEMORY_MAX_BUCKETS = 1000;
const MEMORY_PRUNE_INTERVAL_MS = 60_000;

function parseBucket(raw: string): { count: number; resetAt: number } | null {
  try {
    const parsed = JSON.parse(raw) as { count?: unknown; resetAt?: unknown };
    if (typeof parsed.count !== 'number' || typeof parsed.resetAt !== 'number') return null;
    if (!Number.isFinite(parsed.count) || !Number.isFinite(parsed.resetAt)) return null;
    return { count: parsed.count, resetAt: parsed.resetAt };
  } catch {
    return null;
  }
}

function kvTtlSeconds(windowMs: number, resetAt?: number) {
  if (resetAt === undefined) return Math.max(KV_MIN_TTL_SECONDS, Math.ceil(windowMs / 1000));
  const remaining = Math.ceil((resetAt - Date.now()) / 1000);
  return Math.max(KV_MIN_TTL_SECONDS, remaining);
}

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();
let lastMemoryPrune = 0;

function pruneMemoryBuckets(now = Date.now()) {
  if (now - lastMemoryPrune < MEMORY_PRUNE_INTERVAL_MS && memoryBuckets.size <= MEMORY_MAX_BUCKETS) {
    return;
  }
  lastMemoryPrune = now;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
  while (memoryBuckets.size > MEMORY_MAX_BUCKETS) {
    const oldest = memoryBuckets.keys().next().value;
    if (!oldest) break;
    memoryBuckets.delete(oldest);
  }
}

function isRateLimitedMemory(key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS) {
  const now = Date.now();
  pruneMemoryBuckets(now);
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
 * Retries re-read state and commit a single increment when the write wins.
 * For strict limits, use a Durable Object counter.
 */
async function isRateLimitedKv(
  kv: KVNamespace,
  key: string,
  maxRequests: number,
  windowMs: number,
) {
  const kvKey = `rl:${key}`;

  for (let attempt = 0; attempt < KV_MAX_RETRIES; attempt += 1) {
    const now = Date.now();
    const raw = await kv.get(kvKey);
    let next: { count: number; resetAt: number };

    if (!raw) {
      next = { count: 1, resetAt: now + windowMs };
    } else {
      const bucket = parseBucket(raw);
      if (!bucket) {
        next = { count: 1, resetAt: now + windowMs };
      } else if (bucket.resetAt <= now) {
        next = { count: 1, resetAt: now + windowMs };
      } else {
        next = { count: bucket.count + 1, resetAt: bucket.resetAt };
      }
    }

    await kv.put(kvKey, JSON.stringify(next), {
      expirationTtl: kvTtlSeconds(windowMs, next.resetAt),
    });

    const verifyRaw = await kv.get(kvKey);
    if (!verifyRaw) continue;
    const verified = parseBucket(verifyRaw);
    if (!verified) continue;
    if (verified.resetAt <= now) continue;
    if (verified.count === next.count) {
      return verified.count > maxRequests;
    }
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
  lastMemoryPrune = 0;
}
