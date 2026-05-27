-- One-time owner bootstrap (operator runbook).
-- Run AFTER the owner account exists in Supabase Auth and has signed in once
-- (handle_new_user creates an inactive shepherd profile until an owner activates it).
--
-- 1. Replace the email literal below with the production owner email.
-- 2. Run in Supabase SQL Editor.
-- 3. Confirm with: select email, role, is_active from public.profiles where role = 'owner';

update public.profiles
set role = 'owner', is_active = true, updated_at = now()
where lower(email) = lower('REPLACE_WITH_OWNER_EMAIL');
