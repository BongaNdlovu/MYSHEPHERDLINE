import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { envValidation, getAppEnv } from '@/lib/core/env';

export { envValidation } from '@/lib/core/env';
export const isSupabaseConfigured = envValidation.ok;

let client: SupabaseClient | null = null;

function createSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = getAppEnv();
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function requireSupabase() {
  if (!envValidation.ok) {
    throw new Error(`Supabase is not configured: ${envValidation.missing.join(', ')}`);
  }
  if (!client) client = createSupabaseClient();
  return client;
}

export const supabase = isSupabaseConfigured ? requireSupabase() : (null as never);
