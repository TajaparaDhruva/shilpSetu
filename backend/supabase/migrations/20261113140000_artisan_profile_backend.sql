-- ==============================================================================
-- ShilpSetu Database Migration: Artisan Profile Backend Functionality
-- Migration: artisan_profile_backend.sql (20261113140000_artisan_profile_backend.sql)
-- ==============================================================================

-- 1. Ensure columns on artisan_profiles
alter table public.artisan_profiles add column if not exists story_video_url text;
alter table public.artisan_profiles add column if not exists craft_specialties text[] default array['Handmade', 'Eco-Friendly'];
alter table public.artisan_profiles add column if not exists city text;
alter table public.artisan_profiles add column if not exists state text;
alter table public.artisan_profiles add column if not exists workshop_address text;

-- 2. Ensure artisan_follows table with uniqueness & self-follow prevention
create table if not exists public.artisan_follows (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  artisan_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint uq_artisan_follows unique (customer_id, artisan_id),
  constraint chk_no_self_follow check (customer_id <> artisan_id)
);

create index if not exists idx_artisan_follows_artisan on public.artisan_follows(artisan_id);
create index if not exists idx_artisan_follows_customer on public.artisan_follows(customer_id);

-- 3. Ensure orders and order_items tables for distinct customer count
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'completed' check (status in ('pending', 'completed', 'delivered', 'cancelled')),
  total_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  artisan_id uuid not null references auth.users(id) on delete cascade,
  quantity integer not null default 1,
  price numeric(10, 2) not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_order_items_artisan on public.order_items(artisan_id);
create index if not exists idx_orders_customer_status on public.orders(customer_id, status);

-- 4. Secure Public Artisan Profile View (No private email or phone numbers exposed)
create or replace view public.artisan_detailed_public_view as
select
  ap.user_id as artisan_id,
  coalesce(ap.business_name, p.full_name, 'Skilled Indian Artisan') as name,
  p.avatar_url as profile_picture,
  coalesce(ap.craft_type, 'Traditional Craft') as craft_specialization,
  ap.description as biography,
  coalesce(ap.location, 'India') as location,
  ap.city,
  ap.state,
  ap.is_verified,
  p.created_at as joined_date,
  ap.story_video_url,
  coalesce(ap.craft_specialties, array['Handmade', 'Eco-Friendly']::text[]) as craft_specialties,
  ap.workshop_address,
  ap.experience_years
from public.artisan_profiles ap
left join public.profiles p on ap.user_id = p.id;

-- 5. Stored RPC: get_artisan_profile(p_artisan_id)
create or replace function public.get_artisan_profile(p_artisan_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_res json;
begin
  select json_build_object(
    'artisan_id', adv.artisan_id,
    'name', adv.name,
    'profile_picture', adv.profile_picture,
    'craft_specialization', adv.craft_specialization,
    'biography', adv.biography,
    'location', adv.location,
    'city', adv.city,
    'state', adv.state,
    'is_verified', adv.is_verified,
    'joined_date', adv.joined_date,
    'story_video_url', adv.story_video_url,
    'craft_specialties', adv.craft_specialties,
    'workshop_address', adv.workshop_address,
    'experience_years', adv.experience_years
  )
  into v_res
  from public.artisan_detailed_public_view adv
  where adv.artisan_id = p_artisan_id;

  return v_res;
end;
$$;

-- 6. Stored RPC: get_artisan_statistics(p_artisan_id)
-- Computes real active products, completed distinct buyers, and years on platform
create or replace function public.get_artisan_statistics(p_artisan_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_products_count integer := 0;
  v_customers_count integer := 0;
  v_experience_years integer := 0;
  v_joined_date timestamptz;
begin
  -- 1. Active products count
  select count(id) into v_products_count
  from public.products
  where artisan_id = p_artisan_id and is_active = true;

  -- 2. Distinct customers with completed orders
  select count(distinct o.customer_id) into v_customers_count
  from public.orders o
  join public.order_items oi on o.id = oi.order_id
  where oi.artisan_id = p_artisan_id
    and o.status in ('completed', 'delivered');

  -- 3. Experience years from joined date
  select created_at into v_joined_date
  from public.profiles
  where id = p_artisan_id;

  if v_joined_date is not null then
    v_experience_years := greatest(1, extract(year from age(now(), v_joined_date))::integer);
  else
    v_experience_years := 1;
  end if;

  return json_build_object(
    'products_count', v_products_count,
    'customers_count', v_customers_count,
    'experience_years', v_experience_years
  );
end;
$$;

-- 7. Follow/Unfollow RPC Functions
create or replace function public.follow_artisan_safe(p_artisan_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_customer_id uuid;
begin
  v_customer_id := auth.uid();
  if v_customer_id is null then
    return json_build_object('success', false, 'error', 'Authentication required');
  end if;

  if v_customer_id = p_artisan_id then
    return json_build_object('success', false, 'error', 'Customers cannot follow themselves');
  end if;

  insert into public.artisan_follows (customer_id, artisan_id, created_at)
  values (v_customer_id, p_artisan_id, timezone('utc'::text, now()))
  on conflict (customer_id, artisan_id) do nothing;

  return json_build_object(
    'success', true,
    'artisan_id', p_artisan_id,
    'is_following', true
  );
end;
$$;

create or replace function public.unfollow_artisan_safe(p_artisan_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_customer_id uuid;
begin
  v_customer_id := auth.uid();
  if v_customer_id is null then
    return json_build_object('success', false, 'error', 'Authentication required');
  end if;

  delete from public.artisan_follows
  where customer_id = v_customer_id and artisan_id = p_artisan_id;

  return json_build_object(
    'success', true,
    'artisan_id', p_artisan_id,
    'is_following', false
  );
end;
$$;

create or replace function public.is_following_artisan(p_artisan_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_customer_id uuid;
  v_exists boolean;
begin
  v_customer_id := auth.uid();
  if v_customer_id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.artisan_follows
    where customer_id = v_customer_id and artisan_id = p_artisan_id
  ) into v_exists;

  return v_exists;
end;
$$;

create or replace function public.get_artisan_follower_count(p_artisan_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count integer;
begin
  select count(id)::integer into v_count
  from public.artisan_follows
  where artisan_id = p_artisan_id;

  return coalesce(v_count, 0);
end;
$$;

-- 8. Row Level Security for artisan_follows
alter table public.artisan_follows enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Follows RLS
drop policy if exists "Anyone can read follows" on public.artisan_follows;
create policy "Anyone can read follows"
  on public.artisan_follows for select
  using (true);

drop policy if exists "Authenticated users can insert own follow" on public.artisan_follows;
create policy "Authenticated users can insert own follow"
  on public.artisan_follows for insert
  to authenticated
  with check (auth.uid() = customer_id and customer_id <> artisan_id);

drop policy if exists "Authenticated users can delete own follow" on public.artisan_follows;
create policy "Authenticated users can delete own follow"
  on public.artisan_follows for delete
  to authenticated
  using (auth.uid() = customer_id);

-- Grants
grant select on public.artisan_detailed_public_view to anon, authenticated;
grant execute on function public.get_artisan_profile to anon, authenticated;
grant execute on function public.get_artisan_statistics to anon, authenticated;
grant execute on function public.follow_artisan_safe to authenticated;
grant execute on function public.unfollow_artisan_safe to authenticated;
grant execute on function public.is_following_artisan to authenticated;
grant execute on function public.get_artisan_follower_count to anon, authenticated;

