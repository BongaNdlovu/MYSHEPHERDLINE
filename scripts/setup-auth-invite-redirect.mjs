#!/usr/bin/env node
/**
 * Adds myshepherdline://sign-in to Supabase Auth redirect allow list (invite / magic links).
 * Requires SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... node scripts/setup-auth-invite-redirect.mjs
 */
import { loadEnvFile } from './lib/rls-negative-cases.mjs';

const INVITE_REDIRECT = 'myshepherdline://sign-in';

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

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const baseUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

const getResponse = await fetch(baseUrl, { headers });
if (!getResponse.ok) {
  console.error(`Failed to read auth config (${getResponse.status}): ${await getResponse.text()}`);
  process.exit(1);
}

const current = await getResponse.json();
const existing = (current.uri_allow_list ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

if (existing.includes(INVITE_REDIRECT)) {
  console.log(`Redirect already allowed: ${INVITE_REDIRECT}`);
  process.exit(0);
}

const uri_allow_list = [...existing, INVITE_REDIRECT].join(',');

const patchResponse = await fetch(baseUrl, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ uri_allow_list }),
});

if (!patchResponse.ok) {
  console.error(`Failed to update auth config (${patchResponse.status}): ${await patchResponse.text()}`);
  process.exit(1);
}

const updated = await patchResponse.json();
console.log(`Added invite redirect for project ${projectRef}.`);
console.log(`  uri_allow_list: ${updated.uri_allow_list ?? uri_allow_list}`);
