-- Run this in Supabase SQL Editor to fix database linter security warnings.
-- Safe to run on an existing project (drops and replaces the flagged policies).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
drop policy if exists "Profiles readable by self or admin" on public.profiles;
create policy "Profiles readable by self or admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Members writable by authenticated users" on public.members;
drop policy if exists "Members readable by authenticated users" on public.members;
drop policy if exists "Members readable by assignee or admin" on public.members;
create policy "Members readable by assignee or admin"
  on public.members for select to authenticated
  using (
    assigned_to is null
    or assigned_to = auth.uid()
    or public.is_admin()
  );

create policy "Members insertable by authenticated users"
  on public.members for insert to authenticated
  with check (
    assigned_to is null
    or assigned_to = auth.uid()
    or public.is_admin()
  );

create policy "Members updatable by assignee or admin"
  on public.members for update to authenticated
  using (
    assigned_to is null
    or assigned_to = auth.uid()
    or public.is_admin()
  )
  with check (
    assigned_to is null
    or assigned_to = auth.uid()
    or public.is_admin()
  );

create policy "Members deletable by admin"
  on public.members for delete to authenticated
  using (public.is_admin());

drop policy if exists "Tasks writable by authenticated users" on public.tasks;
drop policy if exists "Tasks readable by authenticated users" on public.tasks;
drop policy if exists "Tasks readable by assignee or admin" on public.tasks;
create policy "Tasks readable by assignee or admin"
  on public.tasks for select to authenticated
  using (
    assignee_id is null
    or assignee_id = auth.uid()
    or public.is_admin()
  );

create policy "Tasks insertable by authenticated users"
  on public.tasks for insert to authenticated
  with check (
    assignee_id is null
    or assignee_id = auth.uid()
    or public.is_admin()
  );

create policy "Tasks updatable by assignee or admin"
  on public.tasks for update to authenticated
  using (
    assignee_id = auth.uid()
    or assignee_id is null
    or public.is_admin()
  )
  with check (
    assignee_id = auth.uid()
    or assignee_id is null
    or public.is_admin()
  );

create policy "Tasks deletable by admin"
  on public.tasks for delete to authenticated
  using (public.is_admin());

drop policy if exists "Visits readable by authenticated users" on public.visits;
drop policy if exists "Visits readable by logger assignee or admin" on public.visits;
create policy "Visits readable by logger assignee or admin"
  on public.visits for select to authenticated
  using (
    logged_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.members m
      where m.id = member_id
      and (m.assigned_to is null or m.assigned_to = auth.uid())
    )
  );

drop policy if exists "Visits insertable by authenticated users" on public.visits;
drop policy if exists "Visits insertable by logger with member access" on public.visits;
create policy "Visits insertable by logger with member access"
  on public.visits for insert to authenticated
  with check (
    logged_by = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.members m
        where m.id = member_id
        and (m.assigned_to is null or m.assigned_to = auth.uid())
      )
    )
  );

-- Trigger-only function: block direct RPC calls from anon/authenticated.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;
