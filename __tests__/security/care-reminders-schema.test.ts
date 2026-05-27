import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('care-reminders migration expectations', () => {
  const migration = readFileSync(
    path.join(process.cwd(), 'supabase/care-reminders-migration.sql'),
    'utf8',
  );

  it('adds task reminder columns', () => {
    expect(migration).toContain('due_at timestamptz');
    expect(migration).toContain('reminder_sent_at timestamptz');
    expect(migration).toContain('reminder_minutes_before integer');
  });

  it('creates assignment_requests with RLS', () => {
    expect(migration).toContain('create table if not exists public.assignment_requests');
    expect(migration).toContain('enable row level security');
    expect(migration).toContain('Assignment requests readable in tenant');
    expect(migration).toContain('Assignment requests insertable by shepherd');
    expect(migration).toContain('Assignment requests updatable by admin');
  });
});
