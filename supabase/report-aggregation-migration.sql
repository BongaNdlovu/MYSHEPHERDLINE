-- Report aggregation and assigned-only RLS documentation migration.
-- Run after schema.sql / organization-capacity-migration.sql.

-- Assigned-only shepherd access is intentional:
-- - Unassigned members/tasks are visible only to admin/owner roles.
-- - Shepherds see rows assigned to them (or visits they logged / for assigned members).

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
