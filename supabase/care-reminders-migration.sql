-- Care progress, assignment requests, and task reminder fields.
-- Safe to re-run on existing projects.

-- Task reminder fields
alter table public.tasks add column if not exists due_at timestamptz;
alter table public.tasks add column if not exists reminder_sent_at timestamptz;
alter table public.tasks add column if not exists reminder_minutes_before integer not null default 60;

-- Backfill due_at from due_date at 09:00 UTC when due_at is null
update public.tasks
set due_at = (due_date::timestamp + interval '9 hours') at time zone 'UTC'
where due_at is null and due_date is not null;

create index if not exists tasks_org_reminder_idx
  on public.tasks (organization_id, status, due_at)
  where status = 'open' and due_at is not null and reminder_sent_at is null;

-- Assignment change requests (shepherd submits, admin approves)
create table if not exists public.assignment_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  member_id uuid references public.members(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (member_id is not null or task_id is not null)
);

alter table public.assignment_requests enable row level security;

create index if not exists assignment_requests_org_status_idx
  on public.assignment_requests (organization_id, status, created_at desc);

create index if not exists assignment_requests_requested_by_idx
  on public.assignment_requests (requested_by, created_at desc);

drop policy if exists "Assignment requests readable in tenant" on public.assignment_requests;
create policy "Assignment requests readable in tenant"
  on public.assignment_requests for select to authenticated
  using (
    public.same_organization(organization_id)
    and (requested_by = auth.uid() or public.is_admin())
  );

drop policy if exists "Assignment requests insertable by shepherd" on public.assignment_requests;
create policy "Assignment requests insertable by shepherd"
  on public.assignment_requests for insert to authenticated
  with check (
    public.same_organization(organization_id)
    and organization_id = public.current_organization_id()
    and requested_by = auth.uid()
    and public.is_active_user()
    and (
      (
        member_id is not null
        and exists (
          select 1 from public.members m
          where m.id = member_id
            and m.organization_id = organization_id
            and (m.assigned_to = auth.uid() or public.is_admin())
        )
      )
      or (
        task_id is not null
        and exists (
          select 1 from public.tasks t
          where t.id = task_id
            and t.organization_id = organization_id
            and (t.assignee_id = auth.uid() or public.is_admin())
        )
      )
    )
  );

drop policy if exists "Assignment requests updatable by admin" on public.assignment_requests;
create policy "Assignment requests updatable by admin"
  on public.assignment_requests for update to authenticated
  using (
    public.same_organization(organization_id)
    and public.is_admin()
  )
  with check (
    public.same_organization(organization_id)
    and organization_id = public.current_organization_id()
    and public.is_admin()
  );
