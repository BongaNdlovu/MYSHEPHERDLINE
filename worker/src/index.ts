import { createServiceClient, isInternalDigestRequest, isOwner, resolveAuth } from './auth';
import { validateWorkerEnv, type WorkerEnv } from './env';
import { corsHeaders, json, readJsonBody, REGISTER_MAX_BODY_BYTES } from './http';
import { createRequestContext, logAudit, logRouteError, logRouteTiming, type RequestContext } from './logger';
import { parseRegisterPayload, registerToken, sendDigest } from './notifications';
import { buildSummary } from './reports';
import { clientRateLimitKey, isRateLimited } from './rate-limit';

export type { WorkerEnv } from './env';

function authErrorResponse(
  request: Request,
  env: WorkerEnv,
  requestContext: RequestContext,
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

function healthResponse(request: Request, env: WorkerEnv, requestContext: RequestContext) {
  return json(request, env, { status: 'healthy', service: 'myshepherdline-api' }, 200, {
    'X-Request-Id': requestContext.requestId,
  });
}

function internalErrorResponse(
  request: Request,
  env: WorkerEnv,
  requestContext: RequestContext,
  startedAt: number,
  error: unknown,
) {
  logRouteError(requestContext, {
    durationMs: Date.now() - startedAt,
    message: error instanceof Error ? error.message : 'Internal server error',
  });
  logRouteTiming(requestContext, {
    status: 500,
    durationMs: Date.now() - startedAt,
  });
  return json(request, env, { error: 'Internal server error' }, 500, {
    'X-Request-Id': requestContext.requestId,
  });
}

async function handleRequest(
  request: Request,
  env: WorkerEnv,
  requestContext: RequestContext,
  startedAt: number,
): Promise<Response> {
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
  const isHealthRoute = url.pathname === '/health';

  if (!isHealthRoute) {
    const rateKey = `${clientRateLimitKey(request)}:${requestContext.path}`;
    if (await isRateLimited(rateKey, { kv: env.RATE_LIMIT })) {
      logAudit(requestContext, 'rate_limit_exceeded');
      return json(request, env, { error: 'Too many requests' }, 429, {
        'X-Request-Id': requestContext.requestId,
      });
    }
  }

  if (isHealthRoute && (request.method === 'GET' || request.method === 'HEAD')) {
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: { ...corsHeaders(request, env), 'X-Request-Id': requestContext.requestId },
      });
    }
    return healthResponse(request, env, requestContext);
  }

  const supabase = createServiceClient(env);

  if (url.pathname === '/reports/summary' && request.method === 'GET') {
    const auth = await resolveAuth(request, env, supabase);
    if ('status' in auth) return authErrorResponse(request, env, requestContext, auth);
    const summary = await buildSummary(supabase, env, auth);
    logRouteTiming(requestContext, {
      status: 200,
      durationMs: Date.now() - startedAt,
      organizationId: auth.organizationId,
      userId: auth.userId,
      usedFallback: false,
    });
    return json(request, env, summary, 200, { 'X-Request-Id': requestContext.requestId });
  }

  if (url.pathname === '/notifications/register' && request.method === 'POST') {
    const auth = await resolveAuth(request, env, supabase);
    if ('status' in auth) return authErrorResponse(request, env, requestContext, auth);

    const parsedBody = await readJsonBody(request, REGISTER_MAX_BODY_BYTES);
    if (!parsedBody.ok) {
      return json(request, env, { error: parsedBody.error }, parsedBody.status, {
        'X-Request-Id': requestContext.requestId,
      });
    }

    const parsed = parseRegisterPayload(parsedBody.body);
    if ('error' in parsed) {
      return json(request, env, { error: parsed.error }, 400, {
        'X-Request-Id': requestContext.requestId,
      });
    }

    const result = await registerToken(supabase, auth.userId, auth.organizationId, parsed);
    if ('error' in result) {
      return json(request, env, { error: result.error }, result.status, {
        'X-Request-Id': requestContext.requestId,
      });
    }

    logAudit(requestContext, 'push_token_registered', { userId: auth.userId });
    return json(request, env, { ok: true }, 200, { 'X-Request-Id': requestContext.requestId });
  }

  if (url.pathname === '/notifications/send-digest' && request.method === 'POST') {
    const internal = isInternalDigestRequest(request, env);
    const auth = internal ? null : await resolveAuth(request, env, supabase);

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
    if ('error' in result) {
      return json(request, env, { error: result.error }, 500, {
        'X-Request-Id': requestContext.requestId,
      });
    }

    logAudit(requestContext, 'digest_sent', {
      sent: result.sent,
      organizations: result.organizations,
      internal,
      userId: auth && !('status' in auth) ? auth.userId : null,
    });
    return json(request, env, result, 200, { 'X-Request-Id': requestContext.requestId });
  }

  return json(request, env, { error: 'Not found' }, 404, {
    'X-Request-Id': requestContext.requestId,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const startedAt = Date.now();
    const requestContext = createRequestContext(request);
    try {
      return await handleRequest(request, env, requestContext, startedAt);
    } catch (error) {
      return internalErrorResponse(request, env, requestContext, startedAt, error);
    }
  },

  async scheduled(_event: ScheduledEvent, env: WorkerEnv): Promise<void> {
    try {
      const missing = validateWorkerEnv(env);
      if (missing.length) {
        console.error(JSON.stringify({ level: 'error', event: 'cron_misconfigured', missing }));
        return;
      }

      if (!env.DIGEST_CRON_SECRET?.trim()) {
        console.error(JSON.stringify({ level: 'error', event: 'cron_secret_missing' }));
        return;
      }

      const supabase = createServiceClient(env);
      const result = await sendDigest(supabase, env);
      if ('error' in result) {
        console.error(JSON.stringify({ level: 'error', event: 'cron_digest_failed', error: result.error }));
        return;
      }

      console.log(
        JSON.stringify({
          level: 'audit',
          event: 'cron_digest_sent',
          sent: result.sent,
          organizations: result.organizations,
          ts: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'cron_unhandled_error',
          message: error instanceof Error ? error.message : 'Cron handler failed',
          ts: new Date().toISOString(),
        }),
      );
    }
  },
};
