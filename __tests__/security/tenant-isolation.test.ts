import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('tenant isolation schema', () => {
  const schema = readFileSync(path.join(process.cwd(), 'supabase/schema.sql'), 'utf8');
  const migration = readFileSync(
    path.join(process.cwd(), 'supabase/organization-capacity-migration.sql'),
    'utf8',
  );

  it('defines organizations and organization_id on operational tables', () => {
    expect(schema).toContain('create table if not exists public.organizations');
    expect(schema).toContain('organization_id uuid not null references public.organizations');
    expect(migration).toContain('alter table public.profiles add column if not exists organization_id');
  });

  it('uses tenant helpers before role checks in policies', () => {
    expect(schema).toContain('create or replace function public.current_organization_id()');
    expect(schema).toContain('create or replace function public.same_organization(row_org_id uuid)');
    expect(schema).toContain('Members readable in tenant by assignee or admin');
    expect(schema).toContain('public.same_organization(organization_id)');
  });

  it('provides worker-side SQL aggregation instead of broad client scans', () => {
    expect(schema).toContain('create or replace function public.worker_report_summary');
    expect(migration).toContain('grant execute on function public.worker_report_summary');
  });

  it('adds capacity indexes for tenant workflows', () => {
    expect(schema).toContain('members_org_assigned_name_idx');
    expect(schema).toContain('tasks_org_assignee_status_due_idx');
    expect(schema).toContain('visits_org_visited_at_idx');
  });

  it('documents optional pg_trgm member search index', () => {
    const trgm = readFileSync(path.join(process.cwd(), 'supabase/member-search-trgm.sql'), 'utf8');
    expect(trgm).toContain('pg_trgm');
    expect(trgm).toContain('members_full_name_trgm_idx');
  });
});
