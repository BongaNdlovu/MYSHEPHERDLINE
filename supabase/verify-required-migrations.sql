-- Verify care-reminders and profile-preferences migrations are applied.
-- Expect one row with all checks = true. If any column is false, run the matching file:
--   supabase/care-reminders-migration.sql
--   supabase/profile-preferences-migration.sql

select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'due_at'
  ) as tasks_due_at,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'reminder_sent_at'
  ) as tasks_reminder_sent_at,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'assignment_requests'
  ) as assignment_requests_table,
  exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'assignment_requests'
      and policyname = 'Assignment requests insertable by shepherd'
  ) as assignment_requests_insert_policy,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'preferred_district_id'
  ) as profiles_preferred_district,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'access_requests'
  ) as access_requests_table,
  exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'access_requests'
      and policyname = 'Access requests insertable by anyone'
  ) as access_requests_insert_policy;
