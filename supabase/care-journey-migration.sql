-- Care journey and care action upgrades for shepherd mobile workflows.
-- Safe to re-run on existing projects.

alter table public.members
  add column if not exists care_stage text not null default 'new';

alter table public.members
  drop constraint if exists members_care_stage_check;

alter table public.members
  add constraint members_care_stage_check
  check (
    care_stage in (
      'new',
      'contacted',
      'visited',
      'bible_study',
      'baptism_interest',
      'integrated',
      'inactive',
      'needs_urgent_care'
    )
  );

update public.members
set care_stage = case
  when status = 'inactive' then 'inactive'
  when status = 'new' then 'new'
  when risk_level = 'high' then 'needs_urgent_care'
  when last_contact_at is not null then 'visited'
  else 'contacted'
end
where care_stage is null
   or care_stage not in (
    'new',
    'contacted',
    'visited',
    'bible_study',
    'baptism_interest',
    'integrated',
    'inactive',
    'needs_urgent_care'
  );

alter table public.visits
  drop constraint if exists visits_visit_type_check;

alter table public.visits
  add constraint visits_visit_type_check
  check (
    visit_type in (
      'visit',
      'call',
      'whatsapp',
      'bible_study',
      'prayer',
      'pastoral_visit',
      'home_visit',
      'baptism_prep',
      'other'
    )
  );

create or replace function public.log_care_action(
  p_member_id uuid,
  p_visit_type text,
  p_notes text,
  p_follow_up_required boolean,
  p_status text default null,
  p_risk_level text default null,
  p_care_stage text default null,
  p_member_notes text default null,
  p_follow_up_title text default null,
  p_follow_up_description text default null,
  p_follow_up_due_date date default null,
  p_follow_up_due_at timestamptz default null,
  p_follow_up_priority text default 'medium',
  p_follow_up_task_type text default null,
  p_follow_up_reminder_minutes_before integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_visited_at timestamptz := now();
  v_visit_id uuid;
  v_task_id uuid;
begin
  if not public.is_active_user() then
    raise exception 'Account deactivated';
  end if;

  if p_status is not null and p_status not in ('active', 'inactive', 'new') then
    raise exception 'Invalid status';
  end if;

  if p_risk_level is not null and p_risk_level not in ('low', 'medium', 'high') then
    raise exception 'Invalid risk level';
  end if;

  if p_care_stage is not null and p_care_stage not in (
    'new',
    'contacted',
    'visited',
    'bible_study',
    'baptism_interest',
    'integrated',
    'inactive',
    'needs_urgent_care'
  ) then
    raise exception 'Invalid care stage';
  end if;

  if p_follow_up_priority is not null and p_follow_up_priority not in ('low', 'medium', 'high') then
    raise exception 'Invalid follow-up priority';
  end if;

  select m.organization_id into v_org_id
  from public.members m
  where m.id = p_member_id
    and m.organization_id = public.current_organization_id()
    and (public.is_admin() or m.assigned_to = auth.uid());

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
    nullif(trim(coalesce(p_notes, '')), ''),
    p_follow_up_required,
    v_visited_at
  )
  returning id into v_visit_id;

  update public.members
  set
    last_contact_at = v_visited_at,
    status = coalesce(p_status, status),
    risk_level = coalesce(p_risk_level, risk_level),
    care_stage = coalesce(p_care_stage, care_stage),
    notes = case
      when p_member_notes is null then notes
      else nullif(trim(p_member_notes), '')
    end,
    updated_at = v_visited_at
  where id = p_member_id;

  if p_follow_up_required then
    insert into public.tasks (
      organization_id,
      title,
      description,
      assignee_id,
      member_id,
      due_date,
      due_at,
      reminder_sent_at,
      reminder_minutes_before,
      status,
      priority,
      task_type,
      updated_at
    )
    values (
      v_org_id,
      coalesce(nullif(trim(coalesce(p_follow_up_title, '')), ''), 'Follow up'),
      nullif(trim(coalesce(p_follow_up_description, '')), ''),
      auth.uid(),
      p_member_id,
      p_follow_up_due_date,
      p_follow_up_due_at,
      null,
      greatest(coalesce(p_follow_up_reminder_minutes_before, 60), 0),
      'open',
      coalesce(p_follow_up_priority, 'medium'),
      nullif(trim(coalesce(p_follow_up_task_type, '')), ''),
      v_visited_at
    )
    returning id into v_task_id;
  end if;

  return jsonb_build_object(
    'visitId', v_visit_id,
    'taskId', v_task_id
  );
end;
$$;

revoke all on function public.log_care_action(
  uuid,
  text,
  text,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  timestamptz,
  text,
  text,
  integer
) from public;
revoke all on function public.log_care_action(
  uuid,
  text,
  text,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  timestamptz,
  text,
  text,
  integer
) from anon;
grant execute on function public.log_care_action(
  uuid,
  text,
  text,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  timestamptz,
  text,
  text,
  integer
) to authenticated;

create index if not exists members_org_care_stage_idx
  on public.members (organization_id, care_stage);
