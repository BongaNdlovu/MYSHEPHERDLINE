import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { WorkerEnv } from './env';

export type AuthContext = {
  userId: string;
  role: 'shepherd' | 'admin';
};

export function createServiceClient(env: WorkerEnv): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getAuthContext(
  request: Request,
  env: WorkerEnv,
): Promise<AuthContext | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  const supabase = createServiceClient(env);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  return {
    userId: data.user.id,
    role: profile?.role === 'admin' ? 'admin' : 'shepherd',
  };
}

export function isAdmin(context: AuthContext) {
  return context.role === 'admin';
}

export function isInternalDigestRequest(request: Request, env: WorkerEnv) {
  const secret = env.DIGEST_CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get('X-Cron-Secret') === secret;
}

export function isValidExpoPushToken(token: string) {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}
