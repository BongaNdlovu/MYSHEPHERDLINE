#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';

const nestedWorkerLockfile = path.join(process.cwd(), 'worker', 'package-lock.json');

if (existsSync(nestedWorkerLockfile)) {
  console.error(
    'worker/package-lock.json must not exist in an npm workspace root. Remove it and rely on the root package-lock.json.',
  );
  process.exit(1);
}

console.log('Lockfile hygiene OK (single root package-lock.json).');
