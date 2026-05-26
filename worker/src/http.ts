import type { WorkerEnv } from './env';
import { safeStringify } from './safe-json';

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
  };

  if (allowOrigin) headers['Access-Control-Allow-Origin'] = allowOrigin;

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
