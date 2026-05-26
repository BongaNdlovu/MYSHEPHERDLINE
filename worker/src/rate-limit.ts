const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > maxRequests;
}

export function clientRateLimitKey(request: Request) {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}
