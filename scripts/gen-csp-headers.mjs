#!/usr/bin/env node
// Generates dist/_headers with a per-environment CSP resolved from EXPO_PUBLIC_* vars.
// Cloudflare static assets do not interpolate env, so the file is produced at build time.
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function originOf(raw) {
  if (!raw?.trim()) return null;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

const distDir = path.resolve(process.cwd(), 'dist');
if (!existsSync(distDir)) {
  console.error('[gen-csp-headers] dist/ not found - run `npx expo export --platform web` first');
  process.exit(1);
}

const supabaseOrigin = originOf(process.env.EXPO_PUBLIC_SUPABASE_URL);
const workerOrigin = originOf(process.env.EXPO_PUBLIC_WORKER_API_URL);

const connectSrc = ["'self'"];
if (supabaseOrigin) {
  connectSrc.push(supabaseOrigin, supabaseOrigin.replace(/^https:/, 'wss:'));
} else {
  connectSrc.push('https://*.supabase.co', 'wss://*.supabase.co');
}
if (workerOrigin) connectSrc.push(workerOrigin);

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  `connect-src ${connectSrc.join(' ')}`,
].join('; ');

const contents = `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`;

writeFileSync(path.join(distDir, '_headers'), contents, 'utf8');
console.log('[gen-csp-headers] wrote dist/_headers');
console.log(`[gen-csp-headers] connect-src ${connectSrc.join(' ')}`);
