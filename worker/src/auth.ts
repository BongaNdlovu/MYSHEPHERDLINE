import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { WorkerEnv } from './env';

export type UserRole = 'shepherd' | 'admin' | 'owner';

export type AuthContext = {
  userId: string;
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

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === 'owner') return 'owner';
  if (role === 'admin') return 'admin';
  return 'shepherd';
}

export async function resolveAuth(request: Request, env: WorkerEnv): Promise<AuthResolution> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return { status: 'unauthorized' };

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return { status: 'unauthorized' };

  const supabase = createServiceClient(env);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { status: 'unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, is_active')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.is_active === false) {
    return { status: 'inactive', userId: data.user.id };
  }

  return {
    userId: data.user.id,
    role: normalizeRole(profile?.role),
    email: profile?.email ?? data.user.email ?? '',
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
