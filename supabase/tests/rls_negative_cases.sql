-- Manual RLS negative-path checks (run in Supabase SQL editor with test users)
-- Replace UUIDs with real auth user ids before executing.

-- Expect 0 rows for shepherd reading another user's push tokens
-- set role authenticated;
-- set request.jwt.claim.sub = '<shepherd-user-id>';
-- select * from public.push_tokens where user_id <> '<shepherd-user-id>';

-- Expect insert failure when logged_by <> auth.uid()
-- insert into public.visits (member_id, logged_by, visit_type)
-- values ('<member-id>', '<other-user-id>', 'call');

-- Expect non-admin delete on members to fail
-- delete from public.members where id = '<member-id>';

-- Expect shepherd digest endpoint forbidden (validate via Worker HTTP test instead)
