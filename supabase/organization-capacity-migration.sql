-- Organization-aware multi-tenant scaling + capacity indexes + report aggregation RPC.
-- Run on existing projects AFTER schema.sql / fix-rls-security.sql.
-- Safe to re-run: uses IF NOT EXISTS / drop policy if exists patterns.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists organization_id uuid references public.organizations(id);
alter table public.members add column if not exists organization_id uuid references public.organizations(id);
alter table public.visits add column if not exists organization_id uuid references public.organizations(id);
alter table public.tasks add column if not exists organization_id uuid references public.organizations(id);
alter table public.push_tokens add column if not exists organization_id uuid references public.organizations(id);
alter table public.audit_events add column if not exists organization_id uuid references public.organizations(id);

-- Default organization for backfill (stable UUID for scripts and seeds).
insert into public.organizations (id, name, slug)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Default Organization',
  'default'
)
on conflict (id) do nothing;

-- Backfill organization_id on operational tables.
update public.profiles
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

update public.members
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

update public.visits v
set organization_id = m.organization_id
from public.members m
where v.member_id = m.id and v.organization_id is null;

update public.tasks t
set organization_id = coalesce(
  (select m.organization_id from public.members m where m.id = t.member_id),
  (select p.organization_id from public.profiles p where p.id = t.assignee_id),
  'a0000000-0000-4000-8000-000000000001'
)
where t.organization_id is null;

update public.push_tokens pt
set organization_id = p.organization_id
from public.profiles p
where pt.user_id = p.id and pt.organization_id is null;

update public.audit_events
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

alter table public.profiles alter column organization_id set not null;
alter table public.members alter column organization_id set not null;
alter table public.visits alter column organization_id set not null;
alter table public.tasks alter column organization_id set not null;
alter table public.push_tokens alter column organization_id set not null;
alter table public.audit_events alter column organization_id set not null;

-- Tenant helpers
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

-- Assign organization on new profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org uuid := 'a0000000-0000-4000-8000-000000000001';
begin
  insert into public.profiles (id, email, display_name, role, organization_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'shepherd',
    default_org
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Tenant-aware RLS (role checks remain inside the tenant)
drop policy if exists "Profiles readable by self or admin" on public.profiles;
create policy "Profiles readable in tenant by self or admin"
  on public.profiles for select to authenticated
  using (
    public.same_organization(organization_id)
    and (id = auth.uid() or public.is_admin())
  );

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

drop policy if exists "Visits insertable by logger with member access" on public.visits;
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

drop policy if exists "Owner can read audit events" on public.audit_events;
create policy "Owner can read audit events in tenant"
  on public.audit_events for select to authenticated
  using (public.same_organization(organization_id) and public.is_owner());

alter table public.organizations enable row level security;
drop policy if exists "Organizations readable by members" on public.organizations;
create policy "Organizations readable by members"
  on public.organizations for select to authenticated
  using (id = public.current_organization_id());

-- Capacity indexes
create index if not exists profiles_organization_id_idx on public.profiles (organization_id);
create index if not exists members_org_assigned_name_idx on public.members (organization_id, assigned_to, full_name);
create index if not exists members_org_status_risk_idx on public.members (organization_id, status, risk_level);
create index if not exists tasks_org_assignee_status_due_idx on public.tasks (organization_id, assignee_id, status, due_date);
create index if not exists tasks_org_status_idx on public.tasks (organization_id, status);
create index if not exists visits_org_visited_at_idx on public.visits (organization_id, visited_at desc);
create index if not exists visits_org_member_idx on public.visits (organization_id, member_id);
create index if not exists visits_org_logged_by_idx on public.visits (organization_id, logged_by);
create index if not exists push_tokens_org_user_idx on public.push_tokens (organization_id, user_id);
create index if not exists audit_events_org_created_idx on public.audit_events (organization_id, created_at desc);

-- Worker-only aggregate RPC (service role); avoids full-table JS scans at scale.
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
  v_since timestamptz := case
    when coalesce(p_recent_days, 7) <= 0 then date_trunc('day', now())
    else now() - make_interval(days => p_recent_days)
  end;
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
    and m.created_at >= v_since
    and (v_global or m.assigned_to = p_user_id);

  return jsonb_build_object(
    'membersNeedingAttention', v_members_needing,
    'visitsCompleted', v_visits_completed,
    'tasksOpen', v_tasks_open,
    'recentActivityDays', coalesce(p_recent_days, 7),
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
