import type { WorkerEnv } from './env';
import { safeStringify } from './safe-json';

export const REGISTER_MAX_BODY_BYTES = 16 * 1024;

export function corsHeaders(request: Request, env: WorkerEnv) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const allowOrigin =
    origin && allowed.includes(origin) ? origin : allowed.length === 1 ? allowed[0] : null;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Cron-Secret',
    'Access-Control-Max-Age': '86400',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };

  if (allowOrigin) headers['Access-Control-Allow-Origin'] = allowOrigin;
  if (origin) headers.Vary = 'Origin';

  return headers;
}

export function json(
  request: Request,
  env: WorkerEnv,
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(safeStringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request, env),
      ...extraHeaders,
    },
  });
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; status: 413 | 400; error: string }
> {
  const contentLength = request.headers.get('Content-Length');
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return { ok: false, status: 413, error: 'Request body too large' };
    }
  }

  const text = await request.text();
  if (text.length > maxBytes) {
    return { ok: false, status: 413, error: 'Request body too large' };
  }

  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON body' };
  }
}
