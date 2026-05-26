-- STAGING ONLY — capacity / load-test seed (do not run on production).
--
-- Targets (defaults): 25,000 members, 250,000 visits, 50,000 tasks across 4 organizations.
-- Adjust the configuration block below for smaller smoke seeds (e.g. 1,000 / 10,000 / 2,000).
--
-- Prerequisites:
--   1. schema.sql + organization-capacity-migration.sql applied
--   2. At least one Supabase Auth user with a profiles row (sign in once)
--   3. Run in Supabase SQL Editor or psql against the staging project
--
-- Idempotency: tags seeded rows with notes = 'capacity-seed' / titles like 'Capacity task %'.
-- Re-run after deleting prior capacity rows (see cleanup block at bottom).

do $$
declare
  -- Scale knobs (full staging defaults)
  v_org_count int := 4;
  v_members_total int := 25000;
  v_visits_total int := 250000;
  v_tasks_total int := 50000;
  v_visits_per_member int;
  v_members_per_org int;
  v_tasks_per_org int;

  v_org_ids uuid[] := array[
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'b0000000-0000-4000-8000-000000000002'::uuid,
    'c0000000-0000-4000-8000-000000000003'::uuid,
    'd0000000-0000-4000-8000-000000000004'::uuid
  ];
  v_org_names text[] := array[
    'Default Organization',
    'Staging Org North',
    'Staging Org South',
    'Staging Org Central'
  ];
  v_org_slugs text[] := array['default', 'staging-north', 'staging-south', 'staging-central'];

  v_org_id uuid;
  v_org_index int;
  v_assignee uuid;
  v_member_start int;
  v_member_end int;
  v_i int;
  v_inserted_members int;
  v_inserted_visits int;
  v_inserted_tasks int;
begin
  if v_members_total < v_org_count then
    raise exception 'members_total (%) must be >= org_count (%)', v_members_total, v_org_count;
  end if;

  v_members_per_org := v_members_total / v_org_count;
  v_tasks_per_org := v_tasks_total / v_org_count;
  v_visits_per_member := greatest(1, v_visits_total / v_members_total);

  raise notice 'Capacity seed starting: % orgs, % members, ~% visits/member, % tasks',
    v_org_count, v_members_total, v_visits_per_member, v_tasks_total;

  for v_org_index in 1..v_org_count loop
    v_org_id := v_org_ids[v_org_index];

    insert into public.organizations (id, name, slug)
    values (v_org_id, v_org_names[v_org_index], v_org_slugs[v_org_index])
    on conflict (id) do update set name = excluded.name, slug = excluded.slug;

    -- Round-robin existing profiles into staging orgs (staging only).
    update public.profiles p
    set organization_id = v_org_id
    where p.id in (
      select id
      from (
        select id, row_number() over (order by created_at, id) as rn
        from public.profiles
      ) numbered
      where (numbered.rn - 1) % v_org_count = v_org_index - 1
    );

    select coalesce(
      (select id from public.profiles where organization_id = v_org_id and is_active and role = 'shepherd' limit 1),
      (select id from public.profiles where organization_id = v_org_id and is_active limit 1)
    )
    into v_assignee;

    if v_assignee is null then
      raise notice 'Skipping org % — no active profiles', v_org_slugs[v_org_index];
      continue;
    end if;

    v_member_start := (v_org_index - 1) * v_members_per_org + 1;
    v_member_end := v_org_index * v_members_per_org;

    insert into public.members (
      organization_id,
      full_name,
      phone,
      email,
      risk_level,
      status,
      notes,
      assigned_to,
      last_contact_at
    )
    select
      v_org_id,
      format('Capacity Member %s-%s', v_org_slugs[v_org_index], g.i),
      format('+27 10%s', lpad(g.i::text, 7, '0')),
      format('member-%s-%s@capacity.staging', v_org_slugs[v_org_index], g.i),
      (array['low', 'medium', 'high'])[1 + floor(random() * 3)::int],
      (array['active', 'inactive', 'new'])[1 + floor(random() * 3)::int],
      'capacity-seed',
      v_assignee,
      now() - (random() * interval '180 days')
    from generate_series(v_member_start, v_member_end) as g(i)
    where not exists (
      select 1 from public.members m
      where m.organization_id = v_org_id and m.notes = 'capacity-seed' and m.full_name = format('Capacity Member %s-%s', v_org_slugs[v_org_index], g.i)
    );

    get diagnostics v_inserted_members = row_count;
    raise notice 'Org %: inserted % members', v_org_slugs[v_org_index], v_inserted_members;

    insert into public.visits (
      organization_id,
      member_id,
      logged_by,
      visit_type,
      notes,
      visited_at
    )
    select
      m.organization_id,
      m.id,
      coalesce(m.assigned_to, v_assignee),
      (array['visit', 'call', 'bible_study', 'other'])[1 + floor(random() * 4)::int],
      'capacity-seed',
      now() - (random() * interval '365 days')
    from public.members m
    cross join generate_series(1, v_visits_per_member) as v(g)
    where m.organization_id = v_org_id
      and m.notes = 'capacity-seed'
      and not exists (
        select 1
        from public.visits existing
        where existing.member_id = m.id and existing.notes = 'capacity-seed'
      );

    get diagnostics v_inserted_visits = row_count;
    raise notice 'Org %: inserted % visits', v_org_slugs[v_org_index], v_inserted_visits;

    insert into public.tasks (
      organization_id,
      title,
      assignee_id,
      member_id,
      due_date,
      status,
      priority,
      task_type
    )
    select
      v_org_id,
      format('Capacity task %s-%s', v_org_slugs[v_org_index], g.i),
      v_assignee,
      (
        select m.id
        from public.members m
        where m.organization_id = v_org_id and m.notes = 'capacity-seed'
        order by random()
        limit 1
      ),
      current_date + (floor(random() * 30)::int - 15),
      (array['open', 'completed', 'cancelled'])[1 + floor(random() * 3)::int],
      (array['low', 'medium', 'high'])[1 + floor(random() * 3)::int],
      (array['call', 'visit', 'review'])[1 + floor(random() * 3)::int]
    from generate_series(1, v_tasks_per_org) as g(i)
    where not exists (
      select 1 from public.tasks t
      where t.organization_id = v_org_id and t.title = format('Capacity task %s-%s', v_org_slugs[v_org_index], g.i)
    );

    get diagnostics v_inserted_tasks = row_count;
    raise notice 'Org %: inserted % tasks', v_org_slugs[v_org_index], v_inserted_tasks;
  end loop;

  raise notice 'Capacity seed complete.';
end $$;

-- Verification
select organization_id, count(*) as members
from public.members
where notes = 'capacity-seed'
group by organization_id
order by organization_id;

select organization_id, count(*) as visits
from public.visits
where notes = 'capacity-seed'
group by organization_id
order by organization_id;

select organization_id, count(*) as tasks
from public.tasks
where title like 'Capacity task %'
group by organization_id
order by organization_id;

-- Cleanup (staging re-seed):
-- delete from public.visits where notes = 'capacity-seed';
-- delete from public.tasks where title like 'Capacity task %';
-- delete from public.members where notes = 'capacity-seed';
