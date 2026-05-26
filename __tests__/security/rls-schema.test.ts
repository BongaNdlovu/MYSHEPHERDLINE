import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('RLS schema expectations', () => {
  const schema = readFileSync(path.join(process.cwd(), 'supabase/schema.sql'), 'utf8');

  it('does not keep permissive ALL policies on members/tasks', () => {
    expect(schema).not.toMatch(/create policy "Members writable by authenticated users"/i);
    expect(schema).not.toMatch(/create policy "Tasks writable by authenticated users"/i);
    expect(schema).not.toMatch(/on public\.members for all to authenticated using \(true\)/);
    expect(schema).not.toMatch(/on public\.tasks for all to authenticated using \(true\)/);
    expect(schema).toContain('drop policy if exists "Members writable by authenticated users"');
  });

  it('locks down handle_new_user execute permissions', () => {
    expect(schema).toContain('revoke all on function public.handle_new_user() from public');
    expect(schema).toContain('revoke all on function public.handle_new_user() from anon, authenticated');
  });

  it('scopes push token access to owner within tenant', () => {
    expect(schema).toContain('Push tokens readable in tenant by owner');
    expect(schema).toMatch(/user_id = auth\.uid\(\)/);
    expect(schema).toContain('public.same_organization(organization_id)');
  });

  it('includes owner role and profile access controls', () => {
    expect(schema).toContain("check (role in ('shepherd', 'admin', 'owner'))");
    expect(schema).toContain('is_active boolean not null default true');
    expect(schema).toContain('Owner can update any profile');
    expect(schema).toContain('enforce_profile_update');
    expect(schema).toContain('create or replace function public.is_owner()');
  });

  it('scopes read access by tenant, role, and assignment', () => {
    expect(schema).toContain('create or replace function public.is_admin()');
    expect(schema).toContain('Profiles readable in tenant by self or admin');
    expect(schema).toContain('Members readable in tenant by assignee or admin');
    expect(schema).toContain('public.same_organization(organization_id)');
    expect(schema).toContain('Visits readable in tenant');
    expect(schema).toContain('Tasks readable in tenant');
    expect(schema).toMatch(
      /create policy "Visits readable in tenant"[\s\S]*logged_by = auth\.uid\(\)/,
    );
    expect(schema).not.toContain('assigned_to is null');
    expect(schema).not.toContain('assignee_id is null');
    expect(schema).not.toMatch(/where lower\(email\) = lower\('[^']+@[^']+'\)/);
    expect(schema).toContain('bootstrap-owner.sql');
    expect(schema).not.toMatch(
      /create policy "Members readable by authenticated users"\s+on public\.members for select to authenticated using \(true\)/,
    );
    expect(schema).not.toMatch(
      /create policy "Visits readable by authenticated users"\s+on public\.visits for select to authenticated using \(true\)/,
    );
    expect(schema).not.toMatch(
      /create policy "Tasks readable by authenticated users"\s+on public\.tasks for select to authenticated using \(true\)/,
    );
  });
});
