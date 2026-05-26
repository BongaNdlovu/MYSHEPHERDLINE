-- Optional data cleanup before production cutover.
-- Replace REPLACE_SHEPHERD_USER_ID with the shepherd who should own legacy records,
-- or assign per row in the admin app after review.
--
-- Review output from verify-null-assignments.sql before running updates.

do $$
declare
  fallback_shepherd_text text := 'REPLACE_SHEPHERD_USER_ID';
  fallback_shepherd uuid;
begin
  if fallback_shepherd_text = 'REPLACE_SHEPHERD_USER_ID' then
    raise exception 'Set fallback_shepherd_text to a real profiles.id before running.';
  end if;

  fallback_shepherd := fallback_shepherd_text::uuid;

  update public.members
  set assigned_to = fallback_shepherd, updated_at = now()
  where assigned_to is null;

  update public.tasks
  set assignee_id = fallback_shepherd, updated_at = now()
  where assignee_id is null;

  raise notice 'Null assignments resolved to shepherd %', fallback_shepherd;
end $$;
