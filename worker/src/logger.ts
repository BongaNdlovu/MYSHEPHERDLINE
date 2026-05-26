import { safeLogPayload } from './safe-json';

export type RequestContext = {
  requestId: string;
  method: string;
  path: string;
};

export function createRequestContext(request: Request): RequestContext {
  return {
    requestId: request.headers.get('CF-Ray') ?? crypto.randomUUID(),
    method: request.method,
    path: new URL(request.url).pathname,
  };
}

export function logAudit(
  context: RequestContext,
  event: string,
  details: Record<string, unknown> = {},
) {
  console.log(
    safeLogPayload({
      level: 'audit',
      event,
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      ...details,
      ts: new Date().toISOString(),
    }),
  );
}

export function logRouteTiming(
  context: RequestContext,
  details: {
    status: number;
    durationMs: number;
    organizationId?: string | null;
    userId?: string | null;
    usedFallback?: boolean;
  },
) {
  console.log(
    safeLogPayload({
      level: 'info',
      event: 'route_timing',
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      ...details,
      ts: new Date().toISOString(),
    }),
  );
}

export function logRouteError(
  context: RequestContext,
  details: {
    durationMs: number;
    message: string;
  },
) {
  console.error(
    safeLogPayload({
      level: 'error',
      event: 'route_error',
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      ...details,
      ts: new Date().toISOString(),
    }),
  );
}
