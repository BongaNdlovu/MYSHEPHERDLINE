#!/usr/bin/env node
/**
 * Live RLS negative-path checks against the configured Supabase project.
 * Run: npm run test:rls:live
 *
 * Requires:
 * - .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * - E2E auth users + supabase/seed-e2e-data.sql applied on the target project
 */
import { resolveRlsLiveConfig, runRlsNegativeCases } from './lib/rls-negative-cases.mjs';

const config = resolveRlsLiveConfig();
if (!config.ready) {
  console.error(`Missing Supabase config: ${config.reason}`);
  process.exit(1);
}

console.log('Running live RLS negative-path checks…');
console.log(`  Project: ${config.url}`);
console.log(`  Shepherd: ${config.shepherdEmail}`);
console.log(`  Admin: ${config.adminEmail}`);

const result = await runRlsNegativeCases(config);
if (!result.ok) {
  console.error('\nRLS negative-path checks failed:');
  for (const failure of result.failures) {
    console.error(`  ✗ ${failure}`);
  }
  process.exit(1);
}

console.log('\nAll RLS negative-path checks passed.');
