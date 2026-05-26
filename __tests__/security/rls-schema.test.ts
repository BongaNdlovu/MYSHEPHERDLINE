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

  it('scopes push token access to owner', () => {
    expect(schema).toContain('Push tokens readable by owner');
    expect(schema).toContain('using (user_id = auth.uid())');
  });
});
