-- MyShepherdLine initial schema

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.organizations (id, name, slug)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Default Organization',
  'default'
)
on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) default 'a0000000-0000-4000-8000-000000000001',
  email text not null,
  display_name text not null,
  role text not null default 'shepherd' check (role in ('shepherd', 'admin', 'owner')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) default 'a0000000-0000-4000-8000-000000000001',
  full_name text not null,
  phone text,
  email text,
  address text,
  risk_level text not null default 'low' check (risk_level in ('high', 'medium', 'low')),
  status text not null default 'active' check (status in ('active', 'inactive', 'new')),
  last_contact_at timestamptz,
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) default 'a0000000-0000-4000-8000-000000000001',
  member_id uuid not null references public.members(id) on delete cascade,
  logged_by uuid not null references public.profiles(id) on delete cascade,
  visit_type text not null default 'visit' check (visit_type in ('visit', 'call', 'bible_study', 'other')),
  notes text,
  follow_up_required boolean not null default false,
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) default 'a0000000-0000-4000-8000-000000000001',
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  due_date date,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  task_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) default 'a0000000-0000-4000-8000-000000000001',
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  device_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.visits enable row level security;
alter table public.tasks enable row level security;
alter table public.push_tokens enable row level security;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id from public.profiles p where p.id = auth.uid();
$$;

revoke all on function public.current_organization_id() from public;
revoke all on function public.current_organization_id() from anon;
grant execute on function public.current_organization_id() to authenticated;

create or replace function public.same_organization(row_org_id uuid)
returns boolean
language sql
stable
as $$
  select row_org_id is not distinct from public.current_organization_id();
$$;

revoke all on function public.same_organization(uuid) from public;
grant execute on function public.same_organization(uuid) to authenticated;

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

-- Drop legacy/overly-permissive policies from earlier installs
drop policy if exists "Members writable by authenticated users" on public.members;
drop policy if exists "Tasks writable by authenticated users" on public.tasks;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
drop policy if exists "Profiles readable by self or admin" on public.profiles;
create policy "Profiles readable in tenant by self or admin"
  on public.profiles for select to authenticated
  using (
    public.same_organization(organization_id)
    and (id = auth.uid() or public.is_admin())
  );

drop policy if exists "Organizations readable by members" on public.organizations;
create policy "Organizations readable by members"
  on public.organizations for select to authenticated
  using (id = public.current_organization_id());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Owner can update any profile" on public.profiles;
create policy "Owner can update any profile"
  on public.profiles for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Members readable by authenticated users" on public.members;
drop policy if exists "Members readable by assignee or admin" on public.members;
create policy "Members readable in tenant by assignee or admin"
  on public.members for select to authenticated
  using (
    public.same_organization(organization_id)
    and (assigned_to = auth.uid() or public.is_admin())
  );

drop policy if exists "Members insertable by authenticated users" on public.members;
create policy "Members insertable in tenant"
  on public.members for insert to authenticated
  with check (
    public.same_organization(organization_id)
    and organization_id = public.current_organization_id()
    and (assigned_to = auth.uid() or public.is_admin())
  );

drop policy if exists "Members updatable by assignee or admin" on public.members;
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
create policy "Members deletable in tenant by admin"
  on public.members for delete to authenticated
  using (public.same_organization(organization_id) and public.is_admin());

drop policy if exists "Visits readable by authenticated users" on public.visits;
drop policy if exists "Visits readable by logger assignee or admin" on public.visits;
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
          and m.organization_id = organization_id
          and m.assigned_to = auth.uid()
      )
    )
  );

drop policy if exists "Tasks readable by authenticated users" on public.tasks;
drop policy if exists "Tasks readable by assignee or admin" on public.tasks;
create policy "Tasks readable in tenant"
  on public.tasks for select to authenticated
  using (
    public.same_organization(organization_id)
    and (assignee_id = auth.uid() or public.is_admin())
  );

drop policy if exists "Tasks insertable by authenticated users" on public.tasks;
create policy "Tasks insertable in tenant"
  on public.tasks for insert to authenticated
  with check (
    public.same_organization(organization_id)
    and organization_id = public.current_organization_id()
    and (assignee_id = auth.uid() or public.is_admin())
  );

drop policy if exists "Tasks updatable by assignee or admin" on public.tasks;
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
create policy "Tasks deletable in tenant by admin"
  on public.tasks for delete to authenticated
  using (public.same_organization(organization_id) and public.is_admin());

drop policy if exists "Push tokens readable by owner" on public.push_tokens;
create policy "Push tokens readable in tenant by owner"
  on public.push_tokens for select to authenticated
  using (public.same_organization(organization_id) and user_id = auth.uid());

drop policy if exists "Push tokens writable by owner" on public.push_tokens;
create policy "Push tokens writable in tenant by owner"
  on public.push_tokens for all to authenticated
  using (public.same_organization(organization_id) and user_id = auth.uid())
  with check (
    public.same_organization(organization_id)
    and user_id = auth.uid()
    and organization_id = public.current_organization_id()
  );

create index if not exists profiles_organization_id_idx on public.profiles (organization_id);
create index if not exists members_org_assigned_name_idx on public.members (organization_id, assigned_to, full_name);
create index if not exists members_org_status_risk_idx on public.members (organization_id, status, risk_level);
create index if not exists tasks_org_assignee_status_due_idx on public.tasks (organization_id, assignee_id, status, due_date);
create index if not exists tasks_org_status_idx on public.tasks (organization_id, status);
create index if not exists visits_org_visited_at_idx on public.visits (organization_id, visited_at desc);
create index if not exists visits_org_member_idx on public.visits (organization_id, member_id);
create index if not exists visits_org_logged_by_idx on public.visits (organization_id, logged_by);
create index if not exists push_tokens_org_user_idx on public.push_tokens (organization_id, user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, organization_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'shepherd',
    'a0000000-0000-4000-8000-000000000001'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Owner bootstrap: run supabase/bootstrap-owner.sql once after the owner signs in.

-- Audit trail for role/access changes (owner-readable).
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) default 'a0000000-0000-4000-8000-000000000001',
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_at_idx on public.audit_events (created_at desc);
create index if not exists audit_events_event_type_idx on public.audit_events (event_type);
create index if not exists audit_events_org_created_idx on public.audit_events (organization_id, created_at desc);

alter table public.audit_events enable row level security;

drop policy if exists "Owner can read audit events" on public.audit_events;
create policy "Owner can read audit events in tenant"
  on public.audit_events for select to authenticated
  using (public.same_organization(organization_id) and public.is_owner());

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

  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, details, organization_id)
  values (auth.uid(), event, 'profiles', new.id, details, new.organization_id);

  return new;
end;
$$;

revoke all on function public.log_profile_audit_event() from public;
revoke all on function public.log_profile_audit_event() from anon, authenticated;

drop trigger if exists profile_audit_after_update on public.profiles;
create trigger profile_audit_after_update
  after update on public.profiles
  for each row execute function public.log_profile_audit_event();

-- Worker-only report aggregates (service role). See organization-capacity-migration.sql for upgrades.
create or replace function public.worker_report_summary(
  p_user_id uuid,
  p_organization_id uuid,
  p_role text,
  p_recent_days integer default 7
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(p_recent_days, 1));
  v_global boolean := p_role in ('admin', 'owner');
  v_members_needing int;
  v_visits_completed int;
  v_tasks_open int;
  v_visits int;
  v_calls int;
  v_bible int;
  v_new_converts int;
begin
  select count(*)::int into v_members_needing
  from public.members m
  where m.organization_id = p_organization_id
    and (v_global or m.assigned_to = p_user_id)
    and (m.risk_level = 'high' or m.status in ('inactive', 'new'));

  select count(*)::int into v_visits_completed
  from public.visits v
  where v.organization_id = p_organization_id
    and v.visited_at >= v_since
    and (
      v_global
      or v.logged_by = p_user_id
      or exists (
        select 1 from public.members m
        where m.id = v.member_id
          and m.organization_id = p_organization_id
          and m.assigned_to = p_user_id
      )
    );

  select count(*)::int into v_tasks_open
  from public.tasks t
  where t.organization_id = p_organization_id
    and t.status = 'open'
    and (v_global or t.assignee_id = p_user_id);

  select
    coalesce(sum(case when v.visit_type = 'visit' then 1 else 0 end), 0)::int,
    coalesce(sum(case when v.visit_type = 'call' then 1 else 0 end), 0)::int,
    coalesce(sum(case when v.visit_type = 'bible_study' then 1 else 0 end), 0)::int
  into v_visits, v_calls, v_bible
  from public.visits v
  where v.organization_id = p_organization_id
    and v.visited_at >= v_since
    and (
      v_global
      or v.logged_by = p_user_id
      or exists (
        select 1 from public.members m
        where m.id = v.member_id
          and m.organization_id = p_organization_id
          and m.assigned_to = p_user_id
      )
    );

  select count(*)::int into v_new_converts
  from public.members m
  where m.organization_id = p_organization_id
    and m.status = 'new'
    and (v_global or m.assigned_to = p_user_id);

  return jsonb_build_object(
    'membersNeedingAttention', v_members_needing,
    'visitsCompleted', v_visits_completed,
    'tasksOpen', v_tasks_open,
    'recentActivityDays', p_recent_days,
    'visitBreakdown', jsonb_build_object(
      'visits', v_visits,
      'calls', v_calls,
      'bibleStudies', v_bible,
      'newConverts', v_new_converts
    )
  );
end;
$$;

revoke all on function public.worker_report_summary(uuid, uuid, text, integer) from public;
revoke all on function public.worker_report_summary(uuid, uuid, text, integer) from anon, authenticated;
grant execute on function public.worker_report_summary(uuid, uuid, text, integer) to service_role;
