-- Security hardening: inactive-user RLS, signup provisioning, atomic visit logging, audit expansion.
-- Safe to re-run on existing projects (uses create or replace / drop if exists).

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  );
$$;

revoke all on function public.is_active_user() from public;
revoke all on function public.is_active_user() from anon;
grant execute on function public.is_active_user() to authenticated;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid() and p.is_active = true;
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner' and p.is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'owner') and p.is_active = true
  );
$$;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id and public.is_active_user())
  with check (
    auth.uid() = id
    and public.is_active_user()
    and organization_id = public.current_organization_id()
  );

drop policy if exists "Organizations readable by members" on public.organizations;
create policy "Organizations readable by members"
  on public.organizations for select to authenticated
  using (public.is_active_user() and id = public.current_organization_id());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, is_active, organization_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'shepherd',
    false,
    'a0000000-0000-4000-8000-000000000001'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.log_visit(
  p_member_id uuid,
  p_visit_type text,
  p_notes text,
  p_follow_up_required boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_visited_at timestamptz := now();
begin
  if not public.is_active_user() then
    raise exception 'Account deactivated';
  end if;

  select m.organization_id into v_org_id
  from public.members m
  where m.id = p_member_id
    and m.organization_id = public.current_organization_id()
    and (
      public.is_admin()
      or m.assigned_to = auth.uid()
    );

  if v_org_id is null then
    raise exception 'Member not found';
  end if;

  insert into public.visits (
    organization_id,
    member_id,
    logged_by,
    visit_type,
    notes,
    follow_up_required,
    visited_at
  )
  values (
    v_org_id,
    p_member_id,
    auth.uid(),
    p_visit_type,
    p_notes,
    p_follow_up_required,
    v_visited_at
  );

  update public.members
  set last_contact_at = v_visited_at, updated_at = v_visited_at
  where id = p_member_id;
end;
$$;

revoke all on function public.log_visit(uuid, text, text, boolean) from public;
revoke all on function public.log_visit(uuid, text, text, boolean) from anon;
grant execute on function public.log_visit(uuid, text, text, boolean) to authenticated;

create or replace function public.log_operational_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event text;
  details jsonb := '{}'::jsonb;
  org_id uuid;
  entity_id uuid;
begin
  if tg_op = 'DELETE' then
    org_id := old.organization_id;
    entity_id := old.id;
  else
    org_id := new.organization_id;
    entity_id := new.id;
  end if;

  if tg_table_name = 'members' then
    if tg_op = 'INSERT' then
      event := 'member_created';
      details := jsonb_build_object('full_name', new.full_name, 'assigned_to', new.assigned_to);
    elsif tg_op = 'DELETE' then
      event := 'member_deleted';
      details := jsonb_build_object('full_name', old.full_name, 'assigned_to', old.assigned_to);
    elsif tg_op = 'UPDATE' then
      if new.assigned_to is distinct from old.assigned_to
        or new.status is distinct from old.status
        or new.risk_level is distinct from old.risk_level then
        event := 'member_updated';
        details := jsonb_build_object(
          'full_name', new.full_name,
          'from_assigned_to', old.assigned_to,
          'to_assigned_to', new.assigned_to,
          'from_status', old.status,
          'to_status', new.status,
          'from_risk_level', old.risk_level,
          'to_risk_level', new.risk_level
        );
      else
        return new;
      end if;
    end if;
  elsif tg_table_name = 'tasks' then
    if tg_op = 'INSERT' then
      event := 'task_created';
      details := jsonb_build_object('title', new.title, 'assignee_id', new.assignee_id, 'member_id', new.member_id);
    elsif tg_op = 'DELETE' then
      event := 'task_deleted';
      details := jsonb_build_object('title', old.title, 'assignee_id', old.assignee_id, 'member_id', old.member_id);
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status
        or new.assignee_id is distinct from old.assignee_id
        or new.priority is distinct from old.priority then
        event := 'task_updated';
        details := jsonb_build_object(
          'title', new.title,
          'from_status', old.status,
          'to_status', new.status,
          'from_assignee_id', old.assignee_id,
          'to_assignee_id', new.assignee_id,
          'from_priority', old.priority,
          'to_priority', new.priority
        );
      else
        return new;
      end if;
    end if;
  elsif tg_table_name = 'visits' then
    if tg_op = 'INSERT' then
      event := 'visit_logged';
      details := jsonb_build_object(
        'member_id', new.member_id,
        'visit_type', new.visit_type,
        'follow_up_required', new.follow_up_required
      );
    else
      return coalesce(new, old);
    end if;
  else
    return coalesce(new, old);
  end if;

  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, details, organization_id)
  values (auth.uid(), event, tg_table_name, entity_id, details, org_id);

  return coalesce(new, old);
end;
$$;

revoke all on function public.log_operational_audit_event() from public;
revoke all on function public.log_operational_audit_event() from anon, authenticated;

drop trigger if exists members_audit_event on public.members;
create trigger members_audit_event
  after insert or update or delete on public.members
  for each row execute function public.log_operational_audit_event();

drop trigger if exists tasks_audit_event on public.tasks;
create trigger tasks_audit_event
  after insert or update or delete on public.tasks
  for each row execute function public.log_operational_audit_event();

drop trigger if exists visits_audit_event on public.visits;
create trigger visits_audit_event
  after insert on public.visits
  for each row execute function public.log_operational_audit_event();

-- Optional: deactivate profiles created before this migration if they were never activated by an owner.
-- update public.profiles set is_active = false where role = 'shepherd' and is_active = true and created_at > now();
