import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('test id coverage', () => {
  it('defines stable ids for primary navigation and auth', async () => {
    const { testIds } = await import('@/constants/testIds');
    expect(testIds.landing.signIn).toBe('landing-sign-in');
    expect(testIds.auth.signInButton).toBe('auth-sign-in-button');
    expect(testIds.tabs.home).toBe('tab-home');
    expect(testIds.more.signOut).toBe('more-sign-out');
  });

  it('maps screens referenced by Maestro flows', async () => {
    const flowDir = path.join(process.cwd(), '.maestro/flows');
    const flows = readFileSync(path.join(flowDir, '02-auth-sign-in-success.yaml'), 'utf8');
    const { testIds } = await import('@/constants/testIds');
    expect(flows).toContain(testIds.home.screen);
    expect(flows).toContain(testIds.tabs.members);
  });
});
