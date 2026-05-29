import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('profile-preferences migration expectations', () => {
  const migration = readFileSync(
    path.join(process.cwd(), 'supabase/profile-preferences-migration.sql'),
    'utf8',
  );

  it('adds profile preference columns', () => {
    expect(migration).toContain('preferred_district_id uuid');
    expect(migration).toContain('preferred_organization_id uuid');
  });

  it('creates access_requests with RLS', () => {
    expect(migration).toContain('create table if not exists public.access_requests');
    expect(migration).toContain('enable row level security');
    expect(migration).toContain('Access requests insertable by anyone');
    expect(migration).toContain('Access requests readable by admin');
    expect(migration).toContain('Access requests updatable by admin');
  });
});
