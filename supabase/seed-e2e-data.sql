-- E2E / manual test seed data for MyShepherdLine
-- Run AFTER schema.sql, role-model-migration.sql, and creating test users in Supabase Auth.
--
-- Steps:
-- 1. Create users in Supabase Auth (Authentication → Users):
--    - shepherd@test.local
--    - admin@test.local
--    - shepherd2@test.local (optional cross-shepherd denial tests)
-- 2. Look up their UUIDs:
--    select id, email from auth.users order by created_at desc;
-- 3. Replace the placeholders below, then run this script.

do $$
declare
  shepherd_id uuid := '0d5c7343-34b6-49fa-9071-23b7937d424a';
  admin_id uuid := '910cea30-c473-4bc5-a607-5eb78b3a9ab7';
  shepherd2_id uuid := 'fe278b31-2265-4879-8c1f-fc52cf754b20';
  member_sarah uuid;
  member_sipho uuid;
begin
  update public.profiles
  set role = 'admin', display_name = 'Test Admin'
  where id = admin_id;

  update public.profiles
  set display_name = 'Test Shepherd'
  where id = shepherd_id;

  -- Sarah: assigned to shepherd2 (shepherd1 must NOT see her — assigned-only)
  insert into public.members (full_name, phone, email, address, risk_level, status, assigned_to)
  values ('Sarah Mkhize', '+27 82 123 4567', 'sarah@example.com', 'Durban', 'high', 'inactive', shepherd2_id)
  on conflict do nothing
  returning id into member_sarah;

  if member_sarah is null then
    select id into member_sarah from public.members where full_name = 'Sarah Mkhize' limit 1;
    update public.members set assigned_to = shepherd2_id where id = member_sarah;
  end if;

  -- Sipho: assigned to test shepherd (E2E member flows)
  insert into public.members (full_name, phone, risk_level, status, assigned_to)
  values ('Sipho Dlamini', '+27 84 345 6789', 'medium', 'new', shepherd_id)
  on conflict do nothing
  returning id into member_sipho;

  if member_sipho is null then
    select id into member_sipho from public.members where full_name = 'Sipho Dlamini' limit 1;
    update public.members set assigned_to = shepherd_id where id = member_sipho;
  end if;

  -- Open task for shepherd on their assigned member
  insert into public.tasks (title, assignee_id, member_id, due_date, status, priority, task_type)
  select 'Follow up with Sipho', shepherd_id, member_sipho, current_date, 'open', 'high', 'call'
  where not exists (
    select 1 from public.tasks where title = 'Follow up with Sipho' and assignee_id = shepherd_id
  );

  -- Admin-only unassigned task (shepherds must NOT see this)
  insert into public.tasks (title, assignee_id, due_date, status, priority, task_type)
  select 'Admin backlog review', admin_id, current_date + 2, 'open', 'medium', 'review'
  where not exists (
    select 1 from public.tasks where title = 'Admin backlog review'
  );

  -- Sample visit on shepherd-assigned member
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

-- Verify assignments (run as owner/admin)
select full_name, assigned_to, status, risk_level
from public.members
order by full_name;
