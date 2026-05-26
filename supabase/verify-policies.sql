-- Run in Supabase SQL Editor after applying schema.sql or role-model-migration.sql
-- Confirms RLS is enabled and read policies are scoped (not using (true)).

-- 1. RLS enabled on core tables
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'members', 'visits', 'tasks', 'push_tokens', 'audit_events')
order by c.relname;

-- 2. All public policies (inspect qual / with_check columns)
select
  tablename,
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Fail if permissive read policies still exist
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and cmd = 'SELECT'
  and (
    qual = 'true'
    or qual is null
  )
  and tablename in ('profiles', 'members', 'visits', 'tasks', 'audit_events');
-- Expect 0 rows

-- 4. Confirm role helper functions exist
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_admin', 'is_owner')
order by p.proname;

-- 5. Confirm owner account is promoted
select email, role, is_active
from public.profiles
where role = 'owner'
order by email;

-- 6. Confirm assigned-only policies (no unassigned shepherd visibility)
select tablename, policyname, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('members', 'tasks', 'visits')
  and (
    qual like '%assigned_to is null%'
    or qual like '%assignee_id is null%'
  );
-- Expect 0 rows
