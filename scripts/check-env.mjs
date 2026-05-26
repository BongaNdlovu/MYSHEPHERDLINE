#!/usr/bin/env node
/**
 * Validates local .env and checks Supabase + Worker connectivity.
 * Usage: node scripts/check-env.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
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
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function ok(message) {
  console.log(`  ✓ ${message}`);
}

function warn(message) {
  console.log(`  ! ${message}`);
}

function fail(message) {
  console.log(`  ✗ ${message}`);
}

const env = { ...process.env, ...loadEnvFile(envPath) };
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const workerUrl = env.EXPO_PUBLIC_WORKER_API_URL?.trim() || '';

console.log('\nMyShepherdLine environment check\n');

if (!existsSync(envPath)) {
  fail('.env file not found — copy .env.example to .env first');
  process.exit(1);
}

ok(`.env found at ${envPath}`);

if (!supabaseUrl || !supabaseKey) {
  fail('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

ok(`Supabase URL: ${supabaseUrl}`);
ok(`Supabase key: ${mask(supabaseKey)}`);

if (workerUrl) {
  ok(`Worker URL: ${workerUrl}`);
} else {
  warn('EXPO_PUBLIC_WORKER_API_URL is empty — reports/push will use Supabase fallback only');
}

console.log('\nConnectivity\n');

let exitCode = 0;

try {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`, {
    headers: { apikey: supabaseKey },
  });
  if (response.ok) {
    ok(`Supabase auth health: ${response.status}`);
  } else {
    fail(`Supabase auth health failed: ${response.status}`);
    exitCode = 1;
  }
} catch (error) {
  fail(`Supabase unreachable: ${error instanceof Error ? error.message : error}`);
  exitCode = 1;
}

try {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
    headers: { apikey: supabaseKey },
  });
  if (response.ok || response.status === 200 || response.status === 401) {
    ok(`Supabase REST API reachable: ${response.status}`);
  } else {
    warn(`Supabase REST returned ${response.status} — check project status`);
  }
} catch (error) {
  fail(`Supabase REST unreachable: ${error instanceof Error ? error.message : error}`);
  exitCode = 1;
}

if (workerUrl) {
  try {
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(`${workerUrl.replace(/\/$/, '')}/health`);
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.status === 'healthy') {
          ok('Worker health: healthy');
          lastError = null;
          break;
        }
        if (response.status === 500 && data.missing) {
          fail(`Worker misconfigured — missing secrets: ${data.missing.join(', ')}`);
          warn('Run: npm run setup:worker');
          exitCode = 1;
          lastError = null;
          break;
        }
        lastError = `Worker health check failed: ${response.status}`;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
      } catch (error) {
        lastError = `Worker unreachable: ${error instanceof Error ? error.message : error}`;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    if (lastError) {
      fail(lastError);
      exitCode = 1;
    }
  } catch (error) {
    fail(`Worker unreachable: ${error instanceof Error ? error.message : error}`);
    exitCode = 1;
  }
} else {
  warn('Skipping Worker health (no URL configured)');
}

console.log('\nNext steps if anything failed\n');
console.log('  1. Apply supabase/fix-rls-security.sql in Supabase SQL Editor');
console.log('  2. Run supabase/verify-policies.sql to confirm RLS policies');
console.log('  3. Run npm run setup:worker to deploy Worker + set secrets');
console.log('  4. Run npm run verify (or verify:win on Windows)\n');

process.exit(exitCode);
