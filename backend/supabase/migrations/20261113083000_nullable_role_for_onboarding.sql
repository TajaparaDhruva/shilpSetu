-- ==============================================================================
-- ShilpSetu Migration: Make role nullable for onboarding flow
-- ==============================================================================
-- Previously role was NOT NULL DEFAULT 'customer', which made it impossible
-- to distinguish "user has not chosen a role yet" from "user explicitly chose
-- customer". This migration changes role to be nullable:
--   NULL  = user has NOT completed role selection (show role-setup screen)
--   'customer' = user explicitly chose customer
--   'artisan'  = user explicitly chose artisan
-- ==============================================================================

-- 1. Drop the existing check constraint and NOT NULL
alter table public.profiles
  alter column role drop not null,
  alter column role drop default;

-- 2. Re-add check constraint that allows NULL or valid values
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role is null or role in ('customer', 'artisan'));

-- 3. Set existing 'customer' rows that were auto-assigned to NULL
-- (only for users who signed up but never explicitly chose a role)
-- NOTE: If you already have real users who chose customer, skip this.
-- For fresh dev databases, this resets everyone to "needs role selection".
-- Comment out the line below if you want to preserve existing role choices:
-- update public.profiles set role = null where role = 'customer';

-- 4. Update the handle_new_user trigger to NOT set a default role
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
    null,  -- role is NULL until user explicitly selects it
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

-- 5. Update the role-protection trigger to also allow setting role from NULL
create or replace function public.prevent_role_modification()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Allow setting role from NULL (first-time selection via RPC)
  -- Block changing from one non-null role to another by regular users
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

-- 6. Update the RLS update policy to allow role changes from NULL
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      -- Allow if role hasn't changed
      role is not distinct from (select p.role from public.profiles p where p.id = auth.uid())
      -- OR if current role is NULL (first-time selection)
      or (select p.role from public.profiles p where p.id = auth.uid()) is null
    )
  );

-- 7. Update the set_user_role RPC to handle NULL -> value transition
create or replace function public.set_user_role(new_role text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
begin
  -- Validate the requested role
  if new_role not in ('customer', 'artisan') then
    return json_build_object('success', false, 'error', 'Invalid role. Must be customer or artisan.');
  end if;

  -- Get the current user's profile
  select * into current_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    return json_build_object('success', false, 'error', 'Profile not found. Please sign up first.');
  end if;

  -- Only allow setting role if it is currently NULL (first-time) or same value
  if current_profile.role is not null and current_profile.role <> new_role then
    return json_build_object('success', false, 'error', 'Role has already been set and cannot be changed.');
  end if;

  -- Update the role
  update public.profiles
  set role = new_role,
      updated_at = timezone('utc'::text, now())
  where id = auth.uid();

  return json_build_object('success', true, 'role', new_role);
end;
$$;

grant execute on function public.set_user_role(text) to authenticated;

