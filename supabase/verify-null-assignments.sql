-- Pre-production rollout check: unassigned members/tasks are admin/owner-only.
-- Expect 0 rows in each result before cutover when using assigned-only shepherd access.

select id, full_name, status, assigned_to, created_at
from public.members
where assigned_to is null
order by created_at;

select id, title, status, assignee_id, created_at
from public.tasks
where assignee_id is null
order by created_at;
