#!/usr/bin/env node
/**
 * Verifies care-reminders and profile-preferences migrations on the linked Supabase project.
 * Requires SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens).
 *
 * Usage:
 *   npm run verify:migrations
 *   node scripts/verify-required-migrations.mjs --apply
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { loadEnvFile } from './lib/rls-negative-cases.mjs';

const VERIFY_QUERY = readFileSync(
  path.join(process.cwd(), 'supabase/verify-required-migrations.sql'),
  'utf8',
)
  .replace(/--[^\n]*/g, '')
  .trim();

const REQUIRED_CHECKS = [
  'tasks_due_at',
  'tasks_reminder_sent_at',
  'assignment_requests_table',
  'assignment_requests_insert_policy',
  'profiles_preferred_district',
  'access_requests_table',
  'access_requests_insert_policy',
];

const MIGRATIONS = [
  {
    name: 'care_reminders',
    file: 'supabase/care-reminders-migration.sql',
  },
  {
    name: 'profile_preferences',
    file: 'supabase/profile-preferences-migration.sql',
  },
];

const root = process.cwd();
const fileEnv = {
  ...loadEnvFile(path.join(root, '.env')),
  ...loadEnvFile(path.join(root, '.env.local')),
};
const env = { ...fileEnv, ...process.env };
const token = env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  env.SUPABASE_PROJECT_REF?.trim() ||
  env.EXPO_PUBLIC_SUPABASE_URL?.replace(/^https:\/\//, '').replace(/\.supabase\.co.*$/, '');
const shouldApply = process.argv.includes('--apply');

if (!token || !projectRef) {
  console.error(
    'Missing SUPABASE_ACCESS_TOKEN or project ref.\n' +
      'Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF (or EXPO_PUBLIC_SUPABASE_URL in .env).\n' +
      'Or run supabase/verify-required-migrations.sql in the Supabase SQL Editor.',
  );
  process.exitCode = 1;
}

async function runQuery(query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Database query failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data?.result ?? data?.rows ?? [];
}

function analyzeRow(row) {
  const missing = REQUIRED_CHECKS.filter((key) => row[key] !== true);
  return { ok: missing.length === 0, missing };
}

async function applyMissingMigrations() {
  for (const migration of MIGRATIONS) {
    const sql = readFileSync(path.join(root, migration.file), 'utf8');
    console.log(`Applying ${migration.file}...`);
    await runQuery(sql);
    console.log(`  + ${migration.name} applied`);
  }
}

async function main() {
  let rows = await runQuery(VERIFY_QUERY);
  let row = rows[0] ?? {};
  let { ok, missing } = analyzeRow(row);

  if (!ok && shouldApply) {
    console.log('Missing objects detected — applying migrations...');
    await applyMissingMigrations();
    rows = await runQuery(VERIFY_QUERY);
    row = rows[0] ?? {};
    ({ ok, missing } = analyzeRow(row));
  }

  if (ok) {
    console.log(`Required migrations verified on project ${projectRef}.`);
    for (const key of REQUIRED_CHECKS) {
      console.log(`  + ${key}`);
    }
    return 0;
  }

  console.error(`Required migrations are NOT fully applied on project ${projectRef}.`);
  for (const key of missing) {
    console.error(`  x ${key}`);
  }
  console.error('\nFix: run in Supabase SQL Editor (or re-run with --apply):');
  console.error('  1. supabase/care-reminders-migration.sql');
  console.error('  2. supabase/profile-preferences-migration.sql');
  return 1;
}

if (process.exitCode !== 1) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
