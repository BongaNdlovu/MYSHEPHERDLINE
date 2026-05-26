#!/usr/bin/env node
/**
 * Live integration check: shepherd auth user -> profile row -> admin can list users.
 * Run: node scripts/test-shepherd-onboarding.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const envPath = path.join(root, '.env');
if (!existsSync(envPath)) {
  console.error('Missing .env');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const SHEPHERD_EMAIL = 'shepherd2@test.local';
const SHEPHERD_PASSWORD = 'TestShepherd2!';
const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = process.env.E2E_PASSWORD ?? 'ChangeMe123!';

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}

async function signIn(email, password) {
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${email} sign-in: ${error.message}`);
  return { client, session: data.session };
}

async function main() {
  console.log('1. Shepherd sign-in + profile role');
  const { client: shepherdClient, session: shepherdSession } = await signIn(
    SHEPHERD_EMAIL,
    SHEPHERD_PASSWORD,
  );
  assert(shepherdSession, 'shepherd session missing');

  const { data: shepherdProfile, error: shepherdProfileError } = await shepherdClient
    .from('profiles')
    .select('email, role, is_active, display_name')
    .eq('id', shepherdSession.user.id)
    .single();

  if (shepherdProfileError) throw new Error(shepherdProfileError.message);
  assert(shepherdProfile.role === 'shepherd', `expected shepherd role, got ${shepherdProfile.role}`);
  assert(shepherdProfile.is_active === true, 'shepherd should be active');
  assert(
    shepherdProfile.display_name === 'Shepherd Two',
    `display_name ${shepherdProfile.display_name}`,
  );
  console.log('   OK', shepherdProfile.email, shepherdProfile.role);

  console.log('2. Admin lists all profiles (Users & Roles data path)');
  const { client: adminClient, session: adminSession } = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert(adminSession, 'admin session missing');

  const { data: profiles, error: listError } = await adminClient
    .from('profiles')
    .select('email, role, is_active')
    .order('email');

  if (listError) throw new Error(listError.message);
  const emails = (profiles ?? []).map((p) => p.email.toLowerCase());
  assert(
    emails.includes(SHEPHERD_EMAIL.toLowerCase()),
    `shepherd2 not in admin list: ${emails.join(', ')}`,
  );
  console.log('   OK admin sees', profiles.length, 'profiles including', SHEPHERD_EMAIL);

  console.log('3. Shepherd cannot list all profiles (RLS)');
  const { data: shepherdList, error: shepherdListError } = await shepherdClient
    .from('profiles')
    .select('email');

  if (shepherdListError) throw new Error(shepherdListError.message);
  assert(
    (shepherdList ?? []).length <= 1,
    `shepherd should only see self, saw ${shepherdList?.length}`,
  );
  console.log('   OK shepherd RLS scoped to', shepherdList?.length ?? 0, 'profile(s)');

  console.log('\nAll shepherd onboarding checks passed.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
