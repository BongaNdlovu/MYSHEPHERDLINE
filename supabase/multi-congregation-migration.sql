-- Districts + multi-congregation support.
-- Safe to re-run on existing projects.

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations add column if not exists district_id uuid references public.districts(id);

insert into public.districts (id, name, slug)
values (
  'b0000000-0000-4000-8000-000000000001',
  'Default District',
  'default-district'
)
on conflict (id) do nothing;

update public.organizations
set district_id = 'b0000000-0000-4000-8000-000000000001'
where district_id is null
  and id = 'a0000000-0000-4000-8000-000000000001';

alter table public.districts enable row level security;

drop policy if exists "Districts readable with congregation" on public.districts;
create policy "Districts readable with congregation"
  on public.districts for select to authenticated
  using (
    public.is_active_user()
    and exists (
      select 1 from public.organizations o
      where o.district_id = districts.id
        and o.id = public.current_organization_id()
    )
  );

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner' and p.is_active = true
  );
$$;

drop policy if exists "Organizations readable by members" on public.organizations;
drop policy if exists "Organizations readable in tenant" on public.organizations;
create policy "Organizations readable in tenant"
  on public.organizations for select to authenticated
  using (
    public.is_active_user()
    and (
      id = public.current_organization_id()
      or (
        public.is_owner()
        and district_id is not distinct from (
          select o.district_id from public.organizations o
          where o.id = public.current_organization_id()
        )
      )
    )
  );

drop policy if exists "Owner can insert congregations" on public.organizations;
create policy "Owner can insert congregations"
  on public.organizations for insert to authenticated
  with check (public.is_owner());

drop policy if exists "Owner can update own congregation" on public.organizations;
create policy "Owner can update own congregation"
  on public.organizations for update to authenticated
  using (id = public.current_organization_id() and public.is_owner())
  with check (id = public.current_organization_id() and public.is_owner());

create index if not exists organizations_district_id_idx on public.organizations (district_id);
