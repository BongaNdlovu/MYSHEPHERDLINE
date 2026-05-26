export interface WorkerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RECENT_ACTIVITY_DAYS?: string;
  DIGEST_CRON_SECRET?: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT?: KVNamespace;
}

export function validateWorkerEnv(env: WorkerEnv) {
  const missing: string[] = [];
  if (!env.SUPABASE_URL?.trim()) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return missing;
}

export function getRecentActivityDays(env: WorkerEnv) {
  const raw = env.RECENT_ACTIVITY_DAYS?.trim();
  if (!raw) return 7;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 7;
  return parsed;
}
