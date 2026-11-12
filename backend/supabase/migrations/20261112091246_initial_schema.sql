-- ==============================================================================
-- ShilpSetu Database Migration: Initial Schema & Profiles
-- ==============================================================================

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'artisan')),
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2. Indexes for efficient lookup
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- 3. Automatic Profile Creation Trigger on User Registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role text;
begin
  -- Validate role from metadata or default to 'customer'
  user_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
  if user_role not in ('customer', 'artisan') then
    user_role := 'customer';
  end if;

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
    user_role,
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

-- 4. Prevent Unrestricted Role Changes by Users
create or replace function public.prevent_role_modification()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Prevent regular authenticated users from escalating or changing their role
  if (new.role is distinct from old.role) and (current_user not in ('postgres', 'service_role', 'supabase_admin')) then
    raise exception 'Unauthorized: Modifying user role directly is not permitted.';
  end if;

  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists tr_prevent_role_modification on public.profiles;
create trigger tr_prevent_role_modification
  before update on public.profiles
  for each row execute function public.prevent_role_modification();

-- 5. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;

-- Policy 1: Users can view their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Policy 2: Users can update their own profile (with role protection check)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Policy 3: Allow profile insert on registration fallback
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

