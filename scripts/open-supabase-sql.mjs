#!/usr/bin/env node
/** Opens Supabase SQL Editor for this project. */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const envPath = path.join(process.cwd(), '.env');
if (!existsSync(envPath)) {
  console.error('.env not found');
  process.exit(1);
}

const env = readFileSync(envPath, 'utf8');
const match = env.match(/EXPO_PUBLIC_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error('Could not parse project ref from EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const projectRef = match[1];
const url = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
console.log(`Opening Supabase SQL Editor:\n${url}\n`);
console.log('Run these files in order:');
console.log('  1. supabase/fix-rls-security.sql  (or schema.sql for new projects)');
console.log('  2. supabase/verify-policies.sql');
console.log('  3. supabase/seed-e2e-data.sql       (after creating test users)\n');

try {
  if (process.platform === 'win32') {
    execSync(`start "" "${url}"`, { stdio: 'ignore' });
  } else if (process.platform === 'darwin') {
    execSync(`open "${url}"`, { stdio: 'ignore' });
  } else {
    execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
  }
} catch {
  console.log('Could not open browser automatically — use the URL above.');
}
