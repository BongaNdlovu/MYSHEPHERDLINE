#!/usr/bin/env node
/**
 * Validates local .env and checks Supabase + Worker connectivity.
 * Usage: node scripts/check-env.mjs [--production]
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function loadEnvFile(filePath, fileExists = existsSync, readFile = readFileSync) {
  if (!fileExists(filePath)) return {};
  const lines = readFile(filePath, 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function mask(value) {
  if (!value) return '(missing)';
  if (value.length <= 8) return '****';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runEnvironmentCheck({
  cwd = process.cwd(),
  argv = process.argv.slice(2),
  env: shellEnv = process.env,
  fetchImpl = fetch,
  consoleImpl = console,
  fileExists = existsSync,
  readFile = readFileSync,
  sleep = defaultSleep,
} = {}) {
  const root = cwd;
  const envPath = path.join(root, '.env');
  const productionCheck = argv.includes('--production');
  const env = { ...shellEnv, ...loadEnvFile(envPath, fileExists, readFile) };
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const workerUrl = env.EXPO_PUBLIC_WORKER_API_URL?.trim() || '';
  const log = (message) => consoleImpl.log(message);
  const logOk = (message) => log(`  + ${message}`);
  const logWarn = (message) => log(`  ! ${message}`);
  const logFail = (message) => log(`  x ${message}`);

  log('\nMyShepherdLine environment check\n');

  if (!fileExists(envPath) && !shellEnv.EXPO_PUBLIC_SUPABASE_URL) {
    logFail('.env file not found - copy .env.example to .env first');
    return 1;
  }

  if (fileExists(envPath)) {
    logOk(`.env found at ${envPath}`);
  } else {
    logOk('Using environment variables from the current shell');
  }

  if (!supabaseUrl || !supabaseKey) {
    logFail('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    return 1;
  }

  logOk(`Supabase URL: ${supabaseUrl}`);
  logOk(`Supabase key: ${mask(supabaseKey)}`);

  if (workerUrl) {
    logOk(`Worker URL: ${workerUrl}`);
  } else {
    logWarn('EXPO_PUBLIC_WORKER_API_URL is empty - reports/push will use Supabase fallback only');
  }

  let exitCode = 0;

  if (productionCheck) {
    log('\nProduction gate\n');

    if (env.EXPO_PUBLIC_LEGAL_REVIEW_COMPLETE === 'true') {
      logOk('Legal review flag enabled');
    } else {
      logFail('EXPO_PUBLIC_LEGAL_REVIEW_COMPLETE must be true for production');
      exitCode = 1;
    }

    if (env.EXPO_PUBLIC_MONITORING_ENABLED === 'true') {
      logOk('Monitoring flag enabled');
    } else {
      logFail('EXPO_PUBLIC_MONITORING_ENABLED must be true for production');
      exitCode = 1;
    }

    if (env.EXPO_PUBLIC_SENTRY_DSN?.trim()) {
      logOk('Sentry DSN configured');
    } else {
      logFail('EXPO_PUBLIC_SENTRY_DSN is required for production monitoring');
      exitCode = 1;
    }

    if (workerUrl) {
      logOk('Worker URL configured for production');
    } else {
      logFail('EXPO_PUBLIC_WORKER_API_URL is required for production');
      exitCode = 1;
    }

    if (env.EXPO_PUBLIC_ALLOW_REPORT_FALLBACK === 'true') {
      logFail('EXPO_PUBLIC_ALLOW_REPORT_FALLBACK must be unset for production');
      exitCode = 1;
    } else {
      logOk('Report fallback disabled for production');
    }
  }

  log('\nConnectivity\n');

  try {
    const response = await fetchImpl(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`, {
      headers: { apikey: supabaseKey },
    });
    if (response.ok) {
      logOk(`Supabase auth health: ${response.status}`);
    } else {
      logFail(`Supabase auth health failed: ${response.status}`);
      exitCode = 1;
    }
  } catch (error) {
    logFail(`Supabase unreachable: ${error instanceof Error ? error.message : error}`);
    exitCode = 1;
  }

  try {
    const response = await fetchImpl(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
      headers: { apikey: supabaseKey },
    });
    if (response.ok || response.status === 200 || response.status === 401) {
      logOk(`Supabase REST API reachable: ${response.status}`);
    } else {
      logWarn(`Supabase REST returned ${response.status} - check project status`);
    }
  } catch (error) {
    logFail(`Supabase REST unreachable: ${error instanceof Error ? error.message : error}`);
    exitCode = 1;
  }

  if (workerUrl) {
    try {
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetchImpl(`${workerUrl.replace(/\/$/, '')}/health`);
          const data = await response.json().catch(() => ({}));
          if (response.ok && data.status === 'healthy') {
            logOk('Worker health: healthy');
            lastError = null;
            break;
          }
          if (response.status === 500) {
            logFail('Worker health returned 500 - check Worker secrets and bindings');
            logWarn('Run: npm run setup:worker');
            exitCode = 1;
            lastError = null;
            break;
          }
          lastError = `Worker health check failed: ${response.status}`;
          if (attempt < 3) await sleep(1500 * attempt);
        } catch (error) {
          lastError = `Worker unreachable: ${error instanceof Error ? error.message : error}`;
          if (attempt < 3) await sleep(1500 * attempt);
        }
      }
      if (lastError) {
        logFail(lastError);
        exitCode = 1;
      }
    } catch (error) {
      logFail(`Worker unreachable: ${error instanceof Error ? error.message : error}`);
      exitCode = 1;
    }
  } else {
    logWarn('Skipping Worker health (no URL configured)');
  }

  log('\nNext steps if anything failed\n');
  log('  1. Apply supabase/fix-rls-security.sql in Supabase SQL Editor');
  log('  2. Run npm run verify:migrations (care-reminders + profile-preferences)');
  log('  3. Run supabase/verify-policies.sql to confirm RLS policies');
  log('  4. Run npm run setup:worker to deploy Worker + set secrets');
  log('  5. Run npm run verify (or verify:win on Windows)');
  if (productionCheck) {
    log('  6. Confirm production-only EAS vars are set and EXPO_PUBLIC_ALLOW_REPORT_FALLBACK is unset\n');
  } else {
    log('');
  }

  return exitCode;
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMainModule) {
  process.exit(await runEnvironmentCheck());
}
