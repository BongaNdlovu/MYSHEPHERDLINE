-- Profile district/conference preferences and public access requests.
-- Safe to re-run on existing projects.

alter table public.profiles add column if not exists preferred_district_id uuid references public.districts(id) on delete set null;
alter table public.profiles add column if not exists preferred_organization_id uuid references public.organizations(id) on delete set null;

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null,
  preferred_district_id uuid references public.districts(id) on delete set null,
  preferred_organization_id uuid references public.organizations(id) on delete set null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  created_at timestamptz not null default now()
);

alter table public.access_requests enable row level security;

create index if not exists access_requests_status_idx on public.access_requests (status, created_at desc);

drop policy if exists "Access requests insertable by anyone" on public.access_requests;
create policy "Access requests insertable by anyone"
  on public.access_requests for insert to anon, authenticated
  with check (
    email is not null and length(trim(email)) > 0
    and display_name is not null and length(trim(display_name)) > 0
  );

drop policy if exists "Access requests readable by admin" on public.access_requests;
create policy "Access requests readable by admin"
  on public.access_requests for select to authenticated
  using (public.is_admin());

drop policy if exists "Access requests updatable by admin" on public.access_requests;
create policy "Access requests updatable by admin"
  on public.access_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Districts readable for preference picker" on public.districts;
create policy "Districts readable for preference picker"
  on public.districts for select to anon, authenticated
  using (true);

drop policy if exists "Organizations readable for preference picker" on public.organizations;
create policy "Organizations readable for preference picker"
  on public.organizations for select to anon, authenticated
  using (true);
