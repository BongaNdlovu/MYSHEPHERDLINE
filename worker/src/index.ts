import { createServiceClient, getAuthContext, isAdmin, isInternalDigestRequest } from './auth';
import { validateWorkerEnv, type WorkerEnv } from './env';
import { corsHeaders, json } from './http';
import { createRequestContext, logAudit } from './logger';
import { parseRegisterPayload, registerToken, sendDigest } from './notifications';
import { buildSummary } from './reports';
import { clientRateLimitKey, isRateLimited } from './rate-limit';

export type { WorkerEnv } from './env';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const requestContext = createRequestContext(request);
    const missing = validateWorkerEnv(env);
    if (missing.length) {
      return json(request, env, { error: 'Worker misconfigured', missing }, 500, {
        'X-Request-Id': requestContext.requestId,
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { ...corsHeaders(request, env), 'X-Request-Id': requestContext.requestId },
      });
    }

    const url = new URL(request.url);

    if (url.pathname !== '/health') {
      const rateKey = `${clientRateLimitKey(request)}:${requestContext.path}`;
      if (await isRateLimited(rateKey, { kv: env.RATE_LIMIT })) {
        logAudit(requestContext, 'rate_limit_exceeded');
        return json(request, env, { error: 'Too many requests' }, 429, {
          'X-Request-Id': requestContext.requestId,
        });
      }
    }

    const supabase = createServiceClient(env);

    if (url.pathname === '/health' && request.method === 'GET') {
      return json(request, env, { status: 'healthy', service: 'myshepherdline-api' }, 200, {
        'X-Request-Id': requestContext.requestId,
      });
    }

    if (url.pathname === '/reports/summary' && request.method === 'GET') {
      const context = await getAuthContext(request, env);
      if (!context) return json(request, env, { error: 'Unauthorized' }, 401, {
        'X-Request-Id': requestContext.requestId,
      });
      const summary = await buildSummary(supabase, env, context);
      return json(request, env, summary, 200, { 'X-Request-Id': requestContext.requestId });
    }

    if (url.pathname === '/notifications/register' && request.method === 'POST') {
      const context = await getAuthContext(request, env);
      if (!context) return json(request, env, { error: 'Unauthorized' }, 401, {
        'X-Request-Id': requestContext.requestId,
      });

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json(request, env, { error: 'Invalid JSON body' }, 400, {
          'X-Request-Id': requestContext.requestId,
        });
      }

      const parsed = parseRegisterPayload(body);
      if ('error' in parsed) return json(request, env, { error: parsed.error }, 400, {
        'X-Request-Id': requestContext.requestId,
      });

      const result = await registerToken(supabase, context.userId, parsed);
      if ('error' in result) return json(request, env, { error: result.error }, 500, {
        'X-Request-Id': requestContext.requestId,
      });

      logAudit(requestContext, 'push_token_registered', { userId: context.userId });
      return json(request, env, { ok: true }, 200, { 'X-Request-Id': requestContext.requestId });
    }

    if (url.pathname === '/notifications/send-digest' && request.method === 'POST') {
      const internal = isInternalDigestRequest(request, env);
      const context = internal ? null : await getAuthContext(request, env);

      if (!internal && (!context || !isAdmin(context))) {
        logAudit(requestContext, 'digest_send_forbidden', {
          userId: context?.userId ?? null,
          internal,
        });
        return json(request, env, { error: 'Forbidden' }, 403, {
          'X-Request-Id': requestContext.requestId,
        });
      }

      const result = await sendDigest(supabase, env);
      if ('error' in result) return json(request, env, { error: result.error }, 500, {
        'X-Request-Id': requestContext.requestId,
      });

      logAudit(requestContext, 'digest_sent', {
        sent: result.sent,
        internal,
        userId: context?.userId ?? null,
      });
      return json(request, env, result, 200, { 'X-Request-Id': requestContext.requestId });
    }

    return json(request, env, { error: 'Not found' }, 404, {
      'X-Request-Id': requestContext.requestId,
    });
  },
};
