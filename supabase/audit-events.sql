-- Persistent audit trail for owner-only security events.
-- Apply after role-model-migration.sql.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_at_idx on public.audit_events (created_at desc);
create index if not exists audit_events_event_type_idx on public.audit_events (event_type);

alter table public.audit_events enable row level security;

drop policy if exists "Owner can read audit events" on public.audit_events;
create policy "Owner can read audit events"
  on public.audit_events for select to authenticated
  using (public.is_owner());

create or replace function public.log_profile_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event text;
  details jsonb := '{}'::jsonb;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.role is distinct from old.role then
    event := 'profile_role_changed';
    details := jsonb_build_object(
      'from_role', old.role,
      'to_role', new.role,
      'target_email', old.email
    );
  elsif new.is_active is distinct from old.is_active then
    event := 'profile_access_changed';
    details := jsonb_build_object(
      'from_active', old.is_active,
      'to_active', new.is_active,
      'target_email', old.email
    );
  else
    return new;
  end if;

  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, details)
  values (auth.uid(), event, 'profiles', new.id, details);

  return new;
end;
$$;

revoke all on function public.log_profile_audit_event() from public;
revoke all on function public.log_profile_audit_event() from anon, authenticated;

drop trigger if exists profile_audit_after_update on public.profiles;
create trigger profile_audit_after_update
  after update on public.profiles
  for each row execute function public.log_profile_audit_event();
