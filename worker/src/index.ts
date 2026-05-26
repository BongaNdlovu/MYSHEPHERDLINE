import { createServiceClient, getAuthContext, isAdmin, isInternalDigestRequest } from './auth';
import { validateWorkerEnv, type WorkerEnv } from './env';
import { corsHeaders, json } from './http';
import { parseRegisterPayload, registerToken, sendDigest } from './notifications';
import { buildSummary } from './reports';
import { clientRateLimitKey, isRateLimited } from './rate-limit';

export type { WorkerEnv } from './env';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const missing = validateWorkerEnv(env);
    if (missing.length) {
      return json(request, env, { error: 'Worker misconfigured', missing }, 500);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    const rateKey = `${clientRateLimitKey(request)}:${new URL(request.url).pathname}`;
    if (isRateLimited(rateKey)) {
      return json(request, env, { error: 'Too many requests' }, 429);
    }

    const url = new URL(request.url);
    const supabase = createServiceClient(env);

    if (url.pathname === '/health' && request.method === 'GET') {
      return json(request, env, { status: 'healthy', service: 'myshepherdline-api' });
    }

    if (url.pathname === '/reports/summary' && request.method === 'GET') {
      const context = await getAuthContext(request, env);
      if (!context) return json(request, env, { error: 'Unauthorized' }, 401);
      const summary = await buildSummary(supabase, env, context);
      return json(request, env, summary);
    }

    if (url.pathname === '/notifications/register' && request.method === 'POST') {
      const context = await getAuthContext(request, env);
      if (!context) return json(request, env, { error: 'Unauthorized' }, 401);

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json(request, env, { error: 'Invalid JSON body' }, 400);
      }

      const parsed = parseRegisterPayload(body);
      if ('error' in parsed) return json(request, env, { error: parsed.error }, 400);

      const result = await registerToken(supabase, context.userId, parsed);
      if ('error' in result) return json(request, env, { error: result.error }, 500);
      return json(request, env, { ok: true });
    }

    if (url.pathname === '/notifications/send-digest' && request.method === 'POST') {
      const internal = isInternalDigestRequest(request, env);
      const context = internal ? null : await getAuthContext(request, env);

      if (!internal && (!context || !isAdmin(context))) {
        return json(request, env, { error: 'Forbidden' }, 403);
      }

      const result = await sendDigest(supabase, env);
      if ('error' in result) return json(request, env, { error: result.error }, 500);
      return json(request, env, result);
    }

    return json(request, env, { error: 'Not found' }, 404);
  },
};
