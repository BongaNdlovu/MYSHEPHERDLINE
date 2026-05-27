-- Run this in Supabase SQL Editor to fix database linter security warnings.
-- Safe to run on an existing project (drops and replaces the flagged policies).
-- Policies retain tenant scoping via same_organization() — do not weaken schema.sql rules.

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  );
$$;

revoke all on function public.is_owner() from public;
revoke all on function public.is_owner() from anon;
grant execute on function public.is_owner() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'owner')
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
drop policy if exists "Profiles readable by self or admin" on public.profiles;
drop policy if exists "Profiles readable in tenant by self or admin" on public.profiles;
create policy "Profiles readable in tenant by self or admin"
  on public.profiles for select to authenticated
  using (
    public.same_organization(organization_id)
    and (id = auth.uid() or public.is_admin())
  );

drop policy if exists "Members writable by authenticated users" on public.members;
drop policy if exists "Members readable by authenticated users" on public.members;
drop policy if exists "Members readable by assignee or admin" on public.members;
drop policy if exists "Members readable in tenant by assignee or admin" on public.members;
create policy "Members readable in tenant by assignee or admin"
  on public.members for select to authenticated
  using (
    public.same_organization(organization_id)
    and (assigned_to = auth.uid() or public.is_admin())
  );

drop policy if exists "Members insertable by authenticated users" on public.members;
drop policy if exists "Members insertable in tenant" on public.members;
create policy "Members insertable in tenant"
  on public.members for insert to authenticated
  with check (
    public.same_organization(organization_id)
    and organization_id = public.current_organization_id()
    and (assigned_to = auth.uid() or public.is_admin())
  );

drop policy if exists "Members updatable by assignee or admin" on public.members;
drop policy if exists "Members updatable in tenant" on public.members;
create policy "Members updatable in tenant"
  on public.members for update to authenticated
  using (
    public.same_organization(organization_id)
    and (assigned_to = auth.uid() or public.is_admin())
  )
  with check (
    public.same_organization(organization_id)
    and organization_id = public.current_organization_id()
    and (assigned_to = auth.uid() or public.is_admin())
  );

drop policy if exists "Members deletable by admin" on public.members;
drop policy if exists "Members deletable in tenant by admin" on public.members;
create policy "Members deletable in tenant by admin"
  on public.members for delete to authenticated
  using (public.same_organization(organization_id) and public.is_admin());

drop policy if exists "Tasks writable by authenticated users" on public.tasks;
drop policy if exists "Tasks readable by authenticated users" on public.tasks;
drop policy if exists "Tasks readable by assignee or admin" on public.tasks;
drop policy if exists "Tasks readable in tenant by assignee or admin" on public.tasks;
create policy "Tasks readable in tenant by assignee or admin"
  on public.tasks for select to authenticated
  using (
    public.same_organization(organization_id)
    and (assignee_id = auth.uid() or public.is_admin())
  );

drop policy if exists "Tasks insertable by authenticated users" on public.tasks;
drop policy if exists "Tasks insertable in tenant" on public.tasks;
create policy "Tasks insertable in tenant"
  on public.tasks for insert to authenticated
  with check (
    public.same_organization(organization_id)
    and organization_id = public.current_organization_id()
    and (assignee_id = auth.uid() or public.is_admin())
  );

drop policy if exists "Tasks updatable by assignee or admin" on public.tasks;
drop policy if exists "Tasks updatable in tenant" on public.tasks;
create policy "Tasks updatable in tenant"
  on public.tasks for update to authenticated
  using (
    public.same_organization(organization_id)
    and (assignee_id = auth.uid() or public.is_admin())
  )
  with check (
    public.same_organization(organization_id)
    and organization_id = public.current_organization_id()
    and (assignee_id = auth.uid() or public.is_admin())
  );

drop policy if exists "Tasks deletable by admin" on public.tasks;
drop policy if exists "Tasks deletable in tenant by admin" on public.tasks;
create policy "Tasks deletable in tenant by admin"
  on public.tasks for delete to authenticated
  using (public.same_organization(organization_id) and public.is_admin());

drop policy if exists "Visits readable by authenticated users" on public.visits;
drop policy if exists "Visits readable by logger assignee or admin" on public.visits;
drop policy if exists "Visits readable in tenant" on public.visits;
create policy "Visits readable in tenant"
  on public.visits for select to authenticated
  using (
    public.same_organization(organization_id)
    and (
      public.is_admin()
      or logged_by = auth.uid()
      or exists (
        select 1 from public.members m
        where m.id = member_id
          and m.organization_id = visits.organization_id
          and m.assigned_to = auth.uid()
      )
    )
  );

drop policy if exists "Visits insertable by authenticated users" on public.visits;
drop policy if exists "Visits insertable by logger with member access" on public.visits;
drop policy if exists "Visits insertable in tenant" on public.visits;
create policy "Visits insertable in tenant"
  on public.visits for insert to authenticated
  with check (
    logged_by = auth.uid()
    and organization_id = public.current_organization_id()
    and (
      public.is_admin()
      or exists (
        select 1 from public.members m
        where m.id = member_id
          and m.organization_id = visits.organization_id
          and m.assigned_to = auth.uid()
      )
    )
  );

-- Trigger-only function: block direct RPC calls from anon/authenticated.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;
