export type AppEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  workerApiUrl: string | null;
  allowReportFallback: boolean;
};

export type EnvValidationResult =
  | { ok: true; env: AppEnv }
  | { ok: false; missing: string[] };

type AppEnvSource = Partial<{
  EXPO_PUBLIC_SUPABASE_URL: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  EXPO_PUBLIC_WORKER_API_URL: string;
  EXPO_PUBLIC_ALLOW_REPORT_FALLBACK: string;
  NODE_ENV: string;
}>;

const REQUIRED_KEYS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
] as const;

function getDefaultEnvSource(): AppEnvSource {
  // Expo only inlines EXPO_PUBLIC_* values when referenced with process.env.NAME dot notation.
  return {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_WORKER_API_URL: process.env.EXPO_PUBLIC_WORKER_API_URL,
    EXPO_PUBLIC_ALLOW_REPORT_FALLBACK: process.env.EXPO_PUBLIC_ALLOW_REPORT_FALLBACK,
    NODE_ENV: process.env.NODE_ENV,
  };
}

export function validateAppEnv(
  source: AppEnvSource = getDefaultEnvSource(),
): EnvValidationResult {
  const missing = REQUIRED_KEYS.filter((key) => !source[key]?.trim());
  if (missing.length) return { ok: false, missing: [...missing] };

  const supabaseUrl = source.EXPO_PUBLIC_SUPABASE_URL!.trim();
  const supabasePublishableKey = source.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.trim();

  if (supabaseUrl.includes('placeholder') || supabasePublishableKey.includes('placeholder')) {
    return { ok: false, missing: ['Valid Supabase credentials (placeholder values detected)'] };
  }

  const allowReportFallback = source.EXPO_PUBLIC_ALLOW_REPORT_FALLBACK === 'true' || source.NODE_ENV === 'development';

  return {
    ok: true,
    env: {
      supabaseUrl,
      supabasePublishableKey,
      workerApiUrl: source.EXPO_PUBLIC_WORKER_API_URL?.trim() || null,
      allowReportFallback,
    },
  };
}

export function getAppEnv(): AppEnv {
  const result = validateAppEnv();
  if (!result.ok) {
    throw new Error(`Missing required configuration: ${result.missing.join(', ')}`);
  }
  return result.env;
}

export const envValidation = validateAppEnv();
