-- Admin-managed access: is_active on profiles, admin profile updates, role guard.
-- Run after schema.sql / fix-rls-security.sql on existing projects.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- Prevent non-admins from elevating role or toggling access on their own row.
create or replace function public.enforce_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.id and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Cannot change role';
    end if;
    if new.is_active is distinct from old.is_active then
      raise exception 'Cannot change access status';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.enforce_profile_update() from public;
revoke all on function public.enforce_profile_update() from anon, authenticated;

drop trigger if exists enforce_profile_update on public.profiles;
create trigger enforce_profile_update
  before update on public.profiles
  for each row execute function public.enforce_profile_update();

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Promote designated admin (run once; safe to re-run).
update public.profiles
set role = 'admin', is_active = true, updated_at = now()
where lower(email) = lower('Fanelesibonge50@gmail.com');
