import { createServiceClient, isInternalDigestRequest, isOwner, resolveAuth, type AuthContext } from './auth';
import { validateWorkerEnv, type WorkerEnv } from './env';
import { corsHeaders, json, readJsonBody, REGISTER_MAX_BODY_BYTES } from './http';
import { createRequestContext, logAudit, logRouteError, logRouteTiming, type RequestContext } from './logger';
import {
  parseRegisterPayload,
  registerToken,
  sendDigest,
  sendTaskReminders,
} from './notifications';
import { inviteAccessRequest, parseInvitePayload } from './provisioning';
import { buildSummary } from './reports';
import { clientRateLimitKey, isRateLimited } from './rate-limit';

const INVITE_MAX_BODY_BYTES = 4 * 1024;

export type { WorkerEnv } from './env';

type AuthResolution = Awaited<ReturnType<typeof resolveAuth>>;
type SupabaseClient = ReturnType<typeof createServiceClient>;

type RouteContext = {
  request: Request;
  env: WorkerEnv;
  requestContext: RequestContext;
  startedAt: number;
  supabase: SupabaseClient;
};

type RouteHandler = (context: RouteContext) => Promise<Response>;

function authErrorResponse(
  request: Request,
  env: WorkerEnv,
  requestContext: RequestContext,
  auth: AuthResolution,
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

async function requireAuthenticatedUser(context: RouteContext): Promise<AuthContext | Response> {
  const auth = await resolveAuth(context.request, context.env, context.supabase);
  if ('status' in auth) {
    return authErrorResponse(context.request, context.env, context.requestContext, auth);
  }
  return auth;
}

async function handleReportsSummary(context: RouteContext): Promise<Response> {
  const authResult = await requireAuthenticatedUser(context);
  if (authResult instanceof Response) return authResult;

  const summary = await buildSummary(context.supabase, context.env, authResult);
  logRouteTiming(context.requestContext, {
    status: 200,
    durationMs: Date.now() - context.startedAt,
    organizationId: authResult.organizationId,
    userId: authResult.userId,
    usedFallback: false,
  });
  return json(context.request, context.env, summary, 200, {
    'X-Request-Id': context.requestContext.requestId,
  });
}

async function handleRegisterNotification(context: RouteContext): Promise<Response> {
  const authResult = await requireAuthenticatedUser(context);
  if (authResult instanceof Response) return authResult;

  const parsedBody = await readJsonBody(context.request, REGISTER_MAX_BODY_BYTES);
  if (!parsedBody.ok) {
    return json(context.request, context.env, { error: parsedBody.error }, parsedBody.status, {
      'X-Request-Id': context.requestContext.requestId,
    });
  }

  const parsed = parseRegisterPayload(parsedBody.body);
  if ('error' in parsed) {
    return json(context.request, context.env, { error: parsed.error }, 400, {
      'X-Request-Id': context.requestContext.requestId,
    });
  }

  const result = await registerToken(
    context.supabase,
    authResult.userId,
    authResult.organizationId,
    parsed,
  );
  if ('error' in result) {
    return json(context.request, context.env, { error: result.error }, result.status, {
      'X-Request-Id': context.requestContext.requestId,
    });
  }

  logAudit(context.requestContext, 'push_token_registered', { userId: authResult.userId });
  return json(context.request, context.env, { ok: true }, 200, {
    'X-Request-Id': context.requestContext.requestId,
  });
}

async function handleSendTaskReminders(context: RouteContext): Promise<Response> {
  const internal = isInternalDigestRequest(context.request, context.env);
  const auth = internal ? null : await resolveAuth(context.request, context.env, context.supabase);

  if (!internal) {
    if (auth && 'status' in auth) {
      return authErrorResponse(context.request, context.env, context.requestContext, auth);
    }
    if (!auth || !isOwner(auth)) {
      logAudit(context.requestContext, 'task_reminders_forbidden', {
        userId: auth && !('status' in auth) ? auth.userId : null,
      });
      return json(context.request, context.env, { error: 'Forbidden' }, 403, {
        'X-Request-Id': context.requestContext.requestId,
      });
    }
  }

  const result = await sendTaskReminders(context.supabase);
  if ('error' in result) {
    return json(context.request, context.env, { error: result.error }, 500, {
      'X-Request-Id': context.requestContext.requestId,
    });
  }

  logAudit(context.requestContext, 'task_reminders_sent', {
    sent: result.sent,
    tasks: result.tasks,
    marked: result.marked,
    internal,
  });
  return json(context.request, context.env, result, 200, {
    'X-Request-Id': context.requestContext.requestId,
  });
}

async function handleSendDigest(context: RouteContext): Promise<Response> {
  const internal = isInternalDigestRequest(context.request, context.env);
  const auth = internal ? null : await resolveAuth(context.request, context.env, context.supabase);

  if (!internal) {
    if (auth && 'status' in auth) {
      return authErrorResponse(context.request, context.env, context.requestContext, auth);
    }
    if (!auth || !isOwner(auth)) {
      logAudit(context.requestContext, 'digest_send_forbidden', {
        userId: auth && !('status' in auth) ? auth.userId : null,
        internal,
        role: auth && !('status' in auth) ? auth.role : null,
      });
      return json(context.request, context.env, { error: 'Forbidden' }, 403, {
        'X-Request-Id': context.requestContext.requestId,
      });
    }
  }

  const result = await sendDigest(context.supabase, context.env);
  if ('error' in result) {
    return json(context.request, context.env, { error: result.error }, 500, {
      'X-Request-Id': context.requestContext.requestId,
    });
  }

  logAudit(context.requestContext, 'digest_sent', {
    sent: result.sent,
    organizations: result.organizations,
    internal,
    userId: auth && !('status' in auth) ? auth.userId : null,
  });
  return json(context.request, context.env, result, 200, {
    'X-Request-Id': context.requestContext.requestId,
  });
}

async function handleInviteAccessRequest(context: RouteContext): Promise<Response> {
  const authResult = await requireAuthenticatedUser(context);
  if (authResult instanceof Response) return authResult;

  const parsedBody = await readJsonBody(context.request, INVITE_MAX_BODY_BYTES);
  if (!parsedBody.ok) {
    return json(context.request, context.env, { error: parsedBody.error }, parsedBody.status, {
      'X-Request-Id': context.requestContext.requestId,
    });
  }

  const parsed = parseInvitePayload(parsedBody.body);
  if ('error' in parsed) {
    return json(context.request, context.env, { error: parsed.error }, 400, {
      'X-Request-Id': context.requestContext.requestId,
    });
  }

  const result = await inviteAccessRequest(
    context.supabase,
    authResult,
    parsed.accessRequestId,
    context.requestContext,
  );
  if ('error' in result) {
    return json(context.request, context.env, { error: result.error }, result.status, {
      'X-Request-Id': context.requestContext.requestId,
    });
  }

  return json(
    context.request,
    context.env,
    { ok: true, email: result.email },
    200,
    { 'X-Request-Id': context.requestContext.requestId },
  );
}

const routes: { method: string; path: string; handler: RouteHandler }[] = [
  { method: 'GET', path: '/reports/summary', handler: handleReportsSummary },
  { method: 'POST', path: '/notifications/register', handler: handleRegisterNotification },
  { method: 'POST', path: '/notifications/send-digest', handler: handleSendDigest },
  { method: 'POST', path: '/notifications/send-reminders', handler: handleSendTaskReminders },
  { method: 'POST', path: '/admin/access-requests/invite', handler: handleInviteAccessRequest },
];

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
  const routeContext: RouteContext = { request, env, requestContext, startedAt, supabase };
  const route = routes.find((entry) => entry.path === url.pathname && entry.method === request.method);
  if (route) {
    return route.handler(routeContext);
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

  async scheduled(event: ScheduledEvent, env: WorkerEnv): Promise<void> {
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
      const isDigestCron = event.cron === '0 8 * * *';

      if (isDigestCron) {
        const digestResult = await sendDigest(supabase, env);
        if ('error' in digestResult) {
          console.error(JSON.stringify({ level: 'error', event: 'cron_digest_failed', error: digestResult.error }));
        } else {
          console.log(
            JSON.stringify({
              level: 'audit',
              event: 'cron_digest_sent',
              sent: digestResult.sent,
              organizations: digestResult.organizations,
              ts: new Date().toISOString(),
            }),
          );
        }
      }

      const reminderResult = await sendTaskReminders(supabase);
      if ('error' in reminderResult) {
        console.error(JSON.stringify({ level: 'error', event: 'cron_reminders_failed', error: reminderResult.error }));
      } else {
        console.log(
          JSON.stringify({
            level: 'audit',
            event: 'cron_task_reminders_sent',
            sent: reminderResult.sent,
            tasks: reminderResult.tasks,
            marked: reminderResult.marked,
            cron: event.cron,
            ts: new Date().toISOString(),
          }),
        );
      }
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
