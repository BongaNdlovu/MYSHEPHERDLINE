#!/usr/bin/env node
/**
 * Tracks npm audit posture without forcing breaking Expo downgrades.
 * Fails on high/critical; reports moderate advisories from the Expo chain.
 */
import { execSync } from 'node:child_process';

let audit;
try {
  audit = JSON.parse(execSync('npm audit --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }));
} catch (err) {
  const stdout = err.stdout?.toString?.() ?? '';
  try {
    audit = JSON.parse(stdout);
  } catch {
    console.error('Unable to parse npm audit output.');
    process.exit(1);
  }
}

const metadata = audit.metadata?.vulnerabilities ?? {};
const moderate = metadata.moderate ?? 0;
const high = metadata.high ?? 0;
const critical = metadata.critical ?? 0;

console.log(`npm audit: critical=${critical} high=${high} moderate=${moderate}`);

if (moderate > 0) {
  console.log(
    'Moderate advisories remain in the Expo dependency chain. Track upstream Expo SDK releases; do not run npm audit fix --force (breaks SDK 56).',
  );
}

if (high > 0 || critical > 0) {
  console.error('High or critical vulnerabilities must be resolved before production.');
  process.exit(1);
}
