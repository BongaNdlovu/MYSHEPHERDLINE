-- Run in Supabase SQL Editor after applying schema.sql or fix-rls-security.sql
-- Confirms RLS is enabled and read policies are scoped (not using (true)).

-- 1. RLS enabled on core tables
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'members', 'visits', 'tasks', 'push_tokens')
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
  and tablename in ('profiles', 'members', 'visits', 'tasks');
-- Expect 0 rows

-- 4. Confirm is_admin helper exists
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'is_admin';
