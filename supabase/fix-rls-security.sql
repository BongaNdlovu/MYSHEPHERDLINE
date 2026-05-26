-- Run this in Supabase SQL Editor to fix database linter security warnings.
-- Safe to run on an existing project (drops and replaces the flagged policies).

drop policy if exists "Members writable by authenticated users" on public.members;
drop policy if exists "Tasks writable by authenticated users" on public.tasks;

create policy "Members insertable by authenticated users"
  on public.members for insert to authenticated
  with check (
    assigned_to is null
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Members updatable by assignee or admin"
  on public.members for update to authenticated
  using (
    assigned_to is null
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    assigned_to is null
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Members deletable by admin"
  on public.members for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Tasks insertable by authenticated users"
  on public.tasks for insert to authenticated
  with check (
    assignee_id is null
    or assignee_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Tasks updatable by assignee or admin"
  on public.tasks for update to authenticated
  using (
    assignee_id = auth.uid()
    or assignee_id is null
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    assignee_id = auth.uid()
    or assignee_id is null
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Tasks deletable by admin"
  on public.tasks for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Trigger-only function: block direct RPC calls from anon/authenticated.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;
