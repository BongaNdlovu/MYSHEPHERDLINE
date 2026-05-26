-- E2E / manual test seed data for MyShepherdLine
-- Run AFTER schema.sql and AFTER creating test users in Supabase Auth.
--
-- Steps:
-- 1. Create users in Supabase Auth (Authentication → Users):
--    - shepherd@test.local (role: shepherd via profile trigger)
--    - admin@test.local   (promote to admin in step 3)
-- 2. Look up their UUIDs:
--    select id, email from auth.users order by created_at desc;
-- 3. Replace the placeholders below, then run this script.

-- ---- CONFIG: replace these UUIDs ----
-- \set shepherd_id '00000000-0000-0000-0000-000000000001'
-- \set admin_id    '00000000-0000-0000-0000-000000000002'

-- Supabase SQL Editor does not support \set — paste UUIDs directly:

do $$
declare
  shepherd_id uuid := '0d5c7343-34b6-49fa-9071-23b7937d424a';
  admin_id uuid := '910cea30-c473-4bc5-a607-5eb78b3a9ab7';
  member_sarah uuid;
  member_sipho uuid;
begin
  -- Promote admin account
  update public.profiles
  set role = 'admin', display_name = 'Test Admin'
  where id = admin_id;

  update public.profiles
  set display_name = 'Test Shepherd'
  where id = shepherd_id;

  -- Sarah: unassigned (visible to all shepherds)
  insert into public.members (full_name, phone, email, address, risk_level, status, assigned_to)
  values ('Sarah Mkhize', '+27 82 123 4567', 'sarah@example.com', 'Durban', 'high', 'inactive', null)
  on conflict do nothing
  returning id into member_sarah;

  if member_sarah is null then
    select id into member_sarah from public.members where full_name = 'Sarah Mkhize' limit 1;
  end if;

  -- Sipho: assigned to test shepherd (E2E member flows)
  insert into public.members (full_name, phone, risk_level, status, assigned_to)
  values ('Sipho Dlamini', '+27 84 345 6789', 'medium', 'new', shepherd_id)
  on conflict do nothing
  returning id into member_sipho;

  if member_sipho is null then
    select id into member_sipho from public.members where full_name = 'Sipho Dlamini' limit 1;
  end if;

  -- Open task for shepherd
  insert into public.tasks (title, assignee_id, member_id, due_date, status, priority, task_type)
  select 'Call Sarah Mkhize', shepherd_id, member_sarah, current_date, 'open', 'high', 'call'
  where not exists (
    select 1 from public.tasks where title = 'Call Sarah Mkhize' and assignee_id = shepherd_id
  );

  -- Unassigned task (visible to all shepherds)
  insert into public.tasks (title, due_date, status, priority, task_type)
  select 'Visit unassigned member', current_date + 2, 'open', 'medium', 'visit'
  where not exists (
    select 1 from public.tasks where title = 'Visit unassigned member'
  );

  -- Sample visit logged by shepherd
  insert into public.visits (member_id, logged_by, visit_type, notes, visited_at)
  select member_sipho, shepherd_id, 'call', 'E2E seed visit', now() - interval '1 day'
  where member_sipho is not null
    and not exists (
      select 1 from public.visits
      where member_id = member_sipho and logged_by = shepherd_id and notes = 'E2E seed visit'
    );

  raise notice 'Seed complete. Shepherd: %, Admin: %, Sarah: %, Sipho: %',
    shepherd_id, admin_id, member_sarah, member_sipho;
end $$;

-- Verify shepherd-visible members (run as admin to inspect data exists)
select full_name, assigned_to, status, risk_level
from public.members
order by full_name;
