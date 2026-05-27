#!/usr/bin/env node
/**
 * Disables public email signup on the linked Supabase project (hosted).
 * Requires SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=ouaqkrvsswxjogivrxbm node scripts/disable-public-signup.mjs
 */
import { loadEnvFile } from './lib/rls-negative-cases.mjs';

const fileEnv = loadEnvFile();
const env = { ...fileEnv, ...process.env };
const token = env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  env.SUPABASE_PROJECT_REF?.trim() ||
  env.EXPO_PUBLIC_SUPABASE_URL?.replace(/^https:\/\//, '').replace(/\.supabase\.co.*$/, '');

if (!token || !projectRef) {
  console.error(
    'Missing SUPABASE_ACCESS_TOKEN or project ref.\n' +
      'Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF (or EXPO_PUBLIC_SUPABASE_URL).',
  );
  process.exit(1);
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ disable_signup: true }),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Failed to disable signup (${response.status}): ${body}`);
  process.exit(1);
}

const config = await response.json();
console.log(`Public signup disabled for project ${projectRef}.`);
console.log(`  disable_signup: ${config.disable_signup ?? true}`);
