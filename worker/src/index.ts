import { createServiceClient, isInternalDigestRequest, isOwner, resolveAuth } from './auth';
import { validateWorkerEnv, type WorkerEnv } from './env';
import { corsHeaders, json } from './http';
import { createRequestContext, logAudit } from './logger';
import { parseRegisterPayload, registerToken, sendDigest } from './notifications';
import { buildSummary } from './reports';
import { clientRateLimitKey, isRateLimited } from './rate-limit';

export type { WorkerEnv } from './env';

function authErrorResponse(
  request: Request,
  env: WorkerEnv,
  requestContext: ReturnType<typeof createRequestContext>,
  auth: Awaited<ReturnType<typeof resolveAuth>>,
) {
  if ('status' in auth && auth.status === 'inactive') {
    logAudit(requestContext, 'inactive_user_rejected', { userId: auth.userId });
    return json(request, env, { error: 'Account deactivated' }, 403, {
      'X-Request-Id': requestContext.requestId,
    });
  }
  return json(request, env, { error: 'Unauthorized' }, 401, {
    'X-Request-Id': requestContext.requestId,
  });
}

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
      const auth = await resolveAuth(request, env);
      if ('status' in auth) return authErrorResponse(request, env, requestContext, auth);
      const summary = await buildSummary(supabase, env, auth);
      return json(request, env, summary, 200, { 'X-Request-Id': requestContext.requestId });
    }

    if (url.pathname === '/notifications/register' && request.method === 'POST') {
      const auth = await resolveAuth(request, env);
      if ('status' in auth) return authErrorResponse(request, env, requestContext, auth);

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

      const result = await registerToken(supabase, auth.userId, parsed);
      if ('error' in result) return json(request, env, { error: result.error }, 500, {
        'X-Request-Id': requestContext.requestId,
      });

      logAudit(requestContext, 'push_token_registered', { userId: auth.userId });
      return json(request, env, { ok: true }, 200, { 'X-Request-Id': requestContext.requestId });
    }

    if (url.pathname === '/notifications/send-digest' && request.method === 'POST') {
      const internal = isInternalDigestRequest(request, env);
      const auth = internal ? null : await resolveAuth(request, env);

      if (!internal) {
        if (auth && 'status' in auth) return authErrorResponse(request, env, requestContext, auth);
        if (!auth || !isOwner(auth)) {
          logAudit(requestContext, 'digest_send_forbidden', {
            userId: auth && !('status' in auth) ? auth.userId : null,
            internal,
            role: auth && !('status' in auth) ? auth.role : null,
          });
          return json(request, env, { error: 'Forbidden' }, 403, {
            'X-Request-Id': requestContext.requestId,
          });
        }
      }

      const result = await sendDigest(supabase, env);
      if ('error' in result) return json(request, env, { error: result.error }, 500, {
        'X-Request-Id': requestContext.requestId,
      });

      logAudit(requestContext, 'digest_sent', {
        sent: result.sent,
        internal,
        userId: auth && !('status' in auth) ? auth.userId : null,
      });
      return json(request, env, result, 200, { 'X-Request-Id': requestContext.requestId });
    }

    return json(request, env, { error: 'Not found' }, 404, {
      'X-Request-Id': requestContext.requestId,
    });
  },
};
