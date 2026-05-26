-- Admin-managed access: is_active on profiles, owner profile updates, role guard.
-- Run after schema.sql / fix-rls-security.sql on existing projects.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('shepherd', 'admin', 'owner'));

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

drop trigger if exists enforce_profile_update on public.profiles;
create trigger enforce_profile_update
  before update on public.profiles
  for each row execute function public.enforce_profile_update();

drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Owner can update any profile" on public.profiles;
create policy "Owner can update any profile"
  on public.profiles for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- Owner bootstrap: run supabase/bootstrap-owner.sql once after the owner signs in.
