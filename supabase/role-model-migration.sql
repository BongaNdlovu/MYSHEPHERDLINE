-- Role model migration: owner | admin | shepherd, assigned-only shepherds, owner-only user management.
-- Run in Supabase SQL Editor on existing projects after schema.sql / fix-rls-security.sql.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('shepherd', 'admin', 'owner'));

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

create or replace function public.enforce_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    if not public.is_owner() then
      raise exception 'Only owner can change roles or access status';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.enforce_profile_update() from public;
revoke all on function public.enforce_profile_update() from anon, authenticated;

drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Owner can update any profile" on public.profiles;
create policy "Owner can update any profile"
  on public.profiles for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "Profiles readable by self or admin" on public.profiles;
create policy "Profiles readable by self or admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Members readable by assignee or admin" on public.members;
create policy "Members readable by assignee or admin"
  on public.members for select to authenticated
  using (assigned_to = auth.uid() or public.is_admin());

drop policy if exists "Members insertable by authenticated users" on public.members;
create policy "Members insertable by authenticated users"
  on public.members for insert to authenticated
  with check (assigned_to = auth.uid() or public.is_admin());

drop policy if exists "Members updatable by assignee or admin" on public.members;
create policy "Members updatable by assignee or admin"
  on public.members for update to authenticated
  using (assigned_to = auth.uid() or public.is_admin())
  with check (assigned_to = auth.uid() or public.is_admin());

drop policy if exists "Visits readable by logger assignee or admin" on public.visits;
create policy "Visits readable by logger assignee or admin"
  on public.visits for select to authenticated
  using (
    public.is_admin()
    or logged_by = auth.uid()
    or exists (
      select 1 from public.members m
      where m.id = member_id and m.assigned_to = auth.uid()
    )
  );

drop policy if exists "Visits insertable by logger with member access" on public.visits;
create policy "Visits insertable by logger with member access"
  on public.visits for insert to authenticated
  with check (
    logged_by = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.members m
        where m.id = member_id and m.assigned_to = auth.uid()
      )
    )
  );

drop policy if exists "Tasks readable by assignee or admin" on public.tasks;
create policy "Tasks readable by assignee or admin"
  on public.tasks for select to authenticated
  using (assignee_id = auth.uid() or public.is_admin());

drop policy if exists "Tasks insertable by authenticated users" on public.tasks;
create policy "Tasks insertable by authenticated users"
  on public.tasks for insert to authenticated
  with check (assignee_id = auth.uid() or public.is_admin());

drop policy if exists "Tasks updatable by assignee or admin" on public.tasks;
create policy "Tasks updatable by assignee or admin"
  on public.tasks for update to authenticated
  using (assignee_id = auth.uid() or public.is_admin())
  with check (assignee_id = auth.uid() or public.is_admin());

-- Owner bootstrap: run supabase/bootstrap-owner.sql once after the owner signs in.
