import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('RLS negative-path static policy coverage', () => {
  const schema = readFileSync(path.join(process.cwd(), 'supabase/schema.sql'), 'utf8');
  const routesTest = readFileSync(
    path.join(process.cwd(), 'worker/src/__tests__/routes.test.ts'),
    'utf8',
  );

  it('scopes push token reads to the authenticated owner', () => {
    expect(schema).toContain('Push tokens readable in tenant by owner');
    expect(schema).toMatch(
      /create policy "Push tokens readable in tenant by owner"[\s\S]*user_id = auth\.uid\(\)/,
    );
  });

  it('requires visit inserts to use the authenticated logger', () => {
    expect(schema).toContain('Visits insertable in tenant');
    expect(schema).toMatch(
      /create policy "Visits insertable in tenant"[\s\S]*logged_by = auth\.uid\(\)/,
    );
  });

  it('restricts member deletes to admins in tenant', () => {
    expect(schema).toContain('Members deletable in tenant by admin');
    expect(schema).toMatch(
      /create policy "Members deletable in tenant by admin"[\s\S]*public\.is_admin\(\)/,
    );
  });

  it('requires confirmation props for destructive admin forms', () => {
    const adminForm = readFileSync(
      path.join(process.cwd(), 'features/admin/components/AdminEntityFormScreen.tsx'),
      'utf8',
    );
    expect(adminForm).toContain('deleteConfirmTitle');
    expect(adminForm).toContain('confirmDestructiveAction');
  });

  it('keeps worker digest send forbidden for non-owner callers', () => {
    expect(routesTest).toContain('rejects digest send for non-owner users');
    expect(routesTest).toMatch(/send-digest[\s\S]*403/);
  });
});

// Live forbidden-query execution: npm run test:rls:live (or RLS_LIVE_TESTS=1 npm run test -- __tests__/security/rls-negative-cases.live.test.ts)
