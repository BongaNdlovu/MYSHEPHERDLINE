-- MyShepherdLine initial schema

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'shepherd' check (role in ('shepherd', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  address text,
  risk_level text not null default 'low' check (risk_level in ('high', 'medium', 'low')),
  status text not null default 'active' check (status in ('active', 'inactive', 'new')),
  last_contact_at timestamptz,
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  logged_by uuid not null references public.profiles(id) on delete cascade,
  visit_type text not null default 'visit' check (visit_type in ('visit', 'call', 'bible_study', 'other')),
  notes text,
  follow_up_required boolean not null default false,
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  due_date date,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  task_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  device_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.visits enable row level security;
alter table public.tasks enable row level security;
alter table public.push_tokens enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Drop legacy/overly-permissive policies from earlier installs
drop policy if exists "Members writable by authenticated users" on public.members;
drop policy if exists "Tasks writable by authenticated users" on public.tasks;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles readable by self or admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Members readable by authenticated users" on public.members;
create policy "Members readable by assignee or admin"
  on public.members for select to authenticated
  using (
    assigned_to is null
    or assigned_to = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Members insertable by authenticated users" on public.members;
create policy "Members insertable by authenticated users"
  on public.members for insert to authenticated
  with check (
    assigned_to is null
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Members updatable by assignee or admin" on public.members;
create policy "Members updatable by assignee or admin"
  on public.members for update to authenticated
  using (
    assigned_to is null
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    assigned_to is null
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Members deletable by admin" on public.members;
create policy "Members deletable by admin"
  on public.members for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Visits readable by authenticated users" on public.visits;
create policy "Visits readable by logger assignee or admin"
  on public.visits for select to authenticated
  using (
    logged_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.members m
      where m.id = member_id
      and (m.assigned_to is null or m.assigned_to = auth.uid())
    )
  );

drop policy if exists "Visits insertable by authenticated users" on public.visits;
create policy "Visits insertable by logger with member access"
  on public.visits for insert to authenticated
  with check (
    logged_by = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.members m
        where m.id = member_id
        and (m.assigned_to is null or m.assigned_to = auth.uid())
      )
    )
  );

drop policy if exists "Tasks readable by authenticated users" on public.tasks;
create policy "Tasks readable by assignee or admin"
  on public.tasks for select to authenticated
  using (
    assignee_id is null
    or assignee_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Tasks insertable by authenticated users" on public.tasks;
create policy "Tasks insertable by authenticated users"
  on public.tasks for insert to authenticated
  with check (
    assignee_id is null
    or assignee_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Tasks updatable by assignee or admin" on public.tasks;
create policy "Tasks updatable by assignee or admin"
  on public.tasks for update to authenticated
  using (
    assignee_id = auth.uid()
    or assignee_id is null
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    assignee_id = auth.uid()
    or assignee_id is null
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Tasks deletable by admin" on public.tasks;
create policy "Tasks deletable by admin"
  on public.tasks for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Push tokens readable by owner" on public.push_tokens;
create policy "Push tokens readable by owner"
  on public.push_tokens for select to authenticated using (user_id = auth.uid());

drop policy if exists "Push tokens writable by owner" on public.push_tokens;
create policy "Push tokens writable by owner"
  on public.push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'shepherd'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
