-- ==============================================================================
-- ShilpSetu Migration: Role & Profile Setup Backend
-- ==============================================================================
-- This migration adds:
--   1. artisan_profiles table for artisan-specific data
--   2. Updated set_user_role() RPC that atomically creates artisan_profiles
--   3. RLS policies for artisan_profiles
--   4. Profile-creation fallback in set_user_role for edge cases
-- ==============================================================================

-- ============================================================
-- 1. Create artisan_profiles table (if not exists)
-- ============================================================
-- Stores artisan-specific data linked to the main profiles table.
-- Created automatically when a user selects the 'artisan' role.
-- Additional fields will be filled in a separate Artisan Profile Setup page.

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

  -- Prevent duplicate artisan profiles for the same user
  constraint uq_artisan_profiles_user_id unique (user_id)
);

-- Index for looking up artisan profile by user
create index if not exists idx_artisan_profiles_user_id
  on public.artisan_profiles(user_id);

-- ============================================================
-- 2. RLS for artisan_profiles
-- ============================================================
alter table public.artisan_profiles enable row level security;

-- Artisans can view their own artisan profile
drop policy if exists "Artisans can view own artisan profile" on public.artisan_profiles;
create policy "Artisans can view own artisan profile"
  on public.artisan_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Artisans can update their own artisan profile
drop policy if exists "Artisans can update own artisan profile" on public.artisan_profiles;
create policy "Artisans can update own artisan profile"
  on public.artisan_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Artisans can insert their own artisan profile (fallback)
drop policy if exists "Artisans can insert own artisan profile" on public.artisan_profiles;
create policy "Artisans can insert own artisan profile"
  on public.artisan_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Customers can view artisan profiles (for browsing artisan stores)
drop policy if exists "Anyone can view artisan profiles" on public.artisan_profiles;
create policy "Anyone can view artisan profiles"
  on public.artisan_profiles
  for select
  to authenticated
  using (true);

-- ============================================================
-- 3. Updated set_user_role() RPC
-- ============================================================
-- Handles:
--   • Validating role input
--   • Rejecting unauthenticated requests (auth.uid() returns NULL)
--   • Creating a profile if missing (edge case / race condition)
--   • Setting role only when current role IS NULL
--   • Blocking role changes once set
--   • Auto-creating artisan_profiles for artisan role
--   • Safe against duplicate artisan_profiles (ON CONFLICT)
--   • Returns the saved role

create or replace function public.set_user_role(selected_role text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_current_role text;
  v_profile_exists boolean;
begin
  -- 1. Get authenticated user ID
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object(
      'success', false,
      'error', 'Authentication required. Please log in first.'
    );
  end if;

  -- 2. Validate role input
  if selected_role is null or selected_role not in ('customer', 'artisan') then
    return json_build_object(
      'success', false,
      'error', 'Invalid role. Must be "customer" or "artisan".'
    );
  end if;

  -- 3. Check if profile exists and get current role
  select role, true into v_current_role, v_profile_exists
  from public.profiles
  where id = v_user_id;

  -- 4. If profile does not exist, create it (edge case / race condition)
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

  -- 5. If role is already set and different, reject
  if v_current_role is not null and v_current_role <> selected_role then
    return json_build_object(
      'success', false,
      'error', 'Your role is already set to "' || v_current_role || '" and cannot be changed.'
    );
  end if;

  -- 6. If role is already the same value, return success without changes
  if v_current_role is not null and v_current_role = selected_role then
    return json_build_object(
      'success', true,
      'role', v_current_role,
      'message', 'Role is already set.'
    );
  end if;

  -- 7. Set the role (current role is NULL → first-time selection)
  update public.profiles
  set role = selected_role,
      updated_at = timezone('utc'::text, now())
  where id = v_user_id;

  -- 8. If artisan, create the artisan_profiles record
  if selected_role = 'artisan' then
    insert into public.artisan_profiles (user_id, created_at, updated_at)
    values (
      v_user_id,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    on conflict (user_id) do nothing;  -- Safe against duplicates
  end if;

  -- 9. Return success
  return json_build_object(
    'success', true,
    'role', selected_role
  );
end;
$$;

-- Only authenticated users can call this function
revoke execute on function public.set_user_role(text) from anon, public;
grant execute on function public.set_user_role(text) to authenticated;

