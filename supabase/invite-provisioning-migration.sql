-- Invite provisioning: read organization and activation from Auth user metadata.
-- Safe to re-run on existing projects.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org uuid := 'a0000000-0000-4000-8000-000000000001';
  meta_org text := nullif(trim(new.raw_user_meta_data->>'organization_id'), '');
  resolved_org uuid;
  invited_active boolean := lower(coalesce(new.raw_user_meta_data->>'is_active', '')) in ('true', '1', 'yes');
  meta_role text := nullif(trim(new.raw_user_meta_data->>'role'), '');
begin
  resolved_org := case
    when meta_org ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then meta_org::uuid
    else default_org
  end;

  insert into public.profiles (
    id,
    email,
    display_name,
    role,
    is_active,
    organization_id,
    preferred_district_id,
    preferred_organization_id
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case
      when meta_role in ('shepherd', 'admin', 'owner') then meta_role
      else 'shepherd'
    end,
    invited_active,
    resolved_org,
    case
      when nullif(trim(new.raw_user_meta_data->>'preferred_district_id'), '') ~* '^[0-9a-f-]{36}$'
        then (new.raw_user_meta_data->>'preferred_district_id')::uuid
      else null
    end,
    case
      when nullif(trim(new.raw_user_meta_data->>'preferred_organization_id'), '') ~* '^[0-9a-f-]{36}$'
        then (new.raw_user_meta_data->>'preferred_organization_id')::uuid
      else resolved_org
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;
