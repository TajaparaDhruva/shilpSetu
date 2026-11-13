-- ==============================================================================
-- ShilpSetu Complete Database Migration: Role & Profile Setup
-- ==============================================================================
-- Run this entire script in your Supabase Dashboard -> SQL Editor -> Run
-- It handles:
--   1. Making profiles.role nullable (so new users have NULL role until selected)
--   2. Updating handle_new_user() trigger to set role = NULL on signup
--   3. Creating public.artisan_profiles table + RLS policies
--   4. Updating prevent_role_modification() trigger
--   5. Creating secure set_user_role(selected_role text) RPC function
-- ==============================================================================

-- 1. Make role column nullable and remove default 'customer'
alter table public.profiles
  alter column role drop not null,
  alter column role drop default;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role is null or role in ('customer', 'artisan'));

-- 2. Create artisan_profiles table
create table if not exists public.artisan_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text,
  craft_type text,
  description text,
  experience_years integer,
  location text,
  is_verified boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint uq_artisan_profiles_user_id unique (user_id)
);

create index if not exists idx_artisan_profiles_user_id
  on public.artisan_profiles(user_id);

-- Enable RLS on artisan_profiles
alter table public.artisan_profiles enable row level security;

drop policy if exists "Artisans can view own artisan profile" on public.artisan_profiles;
create policy "Artisans can view own artisan profile"
  on public.artisan_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Artisans can update own artisan profile" on public.artisan_profiles;
create policy "Artisans can update own artisan profile"
  on public.artisan_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Artisans can insert own artisan profile" on public.artisan_profiles;
create policy "Artisans can insert own artisan profile"
  on public.artisan_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Anyone can view artisan profiles" on public.artisan_profiles;
create policy "Anyone can view artisan profiles"
  on public.artisan_profiles
  for select
  to authenticated
  using (true);

-- 3. Automatic Profile Creation Trigger on Signup (sets role = NULL)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    avatar_url,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    new.phone,
    null,  -- role is NULL until user explicitly chooses on role setup page
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case
      when excluded.full_name is not null and excluded.full_name <> '' then excluded.full_name
      else public.profiles.full_name
    end,
    avatar_url = case
      when excluded.avatar_url is not null and excluded.avatar_url <> '' then excluded.avatar_url
      else public.profiles.avatar_url
    end,
    updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Role protection trigger
create or replace function public.prevent_role_modification()
returns trigger
language plpgsql
security definer
as $$
begin
  if (old.role is not null)
     and (new.role is distinct from old.role)
     and (current_user not in ('postgres', 'service_role', 'supabase_admin'))
  then
    raise exception 'Unauthorized: Modifying an already-assigned role is not permitted.';
  end if;

  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists tr_prevent_role_modification on public.profiles;
create trigger tr_prevent_role_modification
  before update on public.profiles
  for each row execute function public.prevent_role_modification();

-- 5. Secure set_user_role RPC function (supports both selected_role and new_role parameter names)
create or replace function public.set_user_role(selected_role text default null, new_role text default null)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_current_role text;
  v_role text;
begin
  -- Resolve role from either parameter name
  v_role := coalesce(selected_role, new_role);

  -- 1. Authenticated user check
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object(
      'success', false,
      'error', 'Authentication required. Please log in first.'
    );
  end if;

  -- 2. Validate input role
  if v_role is null or v_role not in ('customer', 'artisan') then
    return json_build_object(
      'success', false,
      'error', 'Invalid role. Must be "customer" or "artisan".'
    );
  end if;

  -- 3. Check existing profile
  select role into v_current_role
  from public.profiles
  where id = v_user_id;

  if not found then
    insert into public.profiles (id, email, role, created_at, updated_at)
    values (
      v_user_id,
      (select email from auth.users where id = v_user_id),
      null,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    on conflict (id) do nothing;

    v_current_role := null;
  end if;

  -- 4. Prevent changing an already chosen role to a different one
  if v_current_role is not null and v_current_role <> v_role then
    return json_build_object(
      'success', false,
      'error', 'Your role is already set to "' || v_current_role || '" and cannot be changed.'
    );
  end if;

  -- 5. Update role in profiles
  update public.profiles
  set role = v_role,
      updated_at = timezone('utc'::text, now())
  where id = v_user_id;

  -- 6. If artisan, create artisan_profiles record
  if v_role = 'artisan' then
    insert into public.artisan_profiles (user_id, created_at, updated_at)
    values (
      v_user_id,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    on conflict (user_id) do nothing;
  end if;

  return json_build_object(
    'success', true,
    'role', v_role
  );
end;
$$;

revoke execute on function public.set_user_role(text) from anon, public;
grant execute on function public.set_user_role(text) to authenticated;

