import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { WorkerEnv } from './env';

export type UserRole = 'shepherd' | 'admin' | 'owner';

export type AuthContext = {
  userId: string;
  organizationId: string;
  role: UserRole;
  email: string;
  isActive: true;
};

export type AuthResolution =
  | AuthContext
  | { status: 'inactive'; userId: string }
  | { status: 'unauthorized' };

export function createServiceClient(env: WorkerEnv): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function normalizeRole(role: string | null | undefined): UserRole | null {
  const normalized = role?.trim().toLowerCase();
  if (normalized === 'owner') return 'owner';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'shepherd') return 'shepherd';
  return null;
}

function parseBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1].trim();
  return token || null;
}

export async function resolveAuth(request: Request, env: WorkerEnv): Promise<AuthResolution> {
  const token = parseBearerToken(request);
  if (!token) return { status: 'unauthorized' };

  const supabase = createServiceClient(env);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { status: 'unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, is_active, organization_id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile || profile.is_active !== true) {
    return { status: 'inactive', userId: data.user.id };
  }

  if (!profile.organization_id) {
    return { status: 'unauthorized' };
  }

  const role = normalizeRole(profile.role);
  if (!role) {
    return { status: 'unauthorized' };
  }

  return {
    userId: data.user.id,
    organizationId: profile.organization_id,
    role,
    email: profile.email ?? data.user.email ?? '',
    isActive: true,
  };
}

/** @deprecated Use resolveAuth */
export async function getAuthContext(request: Request, env: WorkerEnv): Promise<AuthContext | null> {
  const auth = await resolveAuth(request, env);
  if ('status' in auth) return null;
  return auth;
}

export function hasGlobalScope(context: AuthContext) {
  return context.role === 'admin' || context.role === 'owner';
}

export function isOwner(context: AuthContext) {
  return context.role === 'owner';
}

/** @deprecated Use hasGlobalScope */
export function isAdmin(context: AuthContext) {
  return hasGlobalScope(context);
}

export function isInternalDigestRequest(request: Request, env: WorkerEnv) {
  const secret = env.DIGEST_CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get('X-Cron-Secret') === secret;
}

export function isValidExpoPushToken(token: string) {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}
