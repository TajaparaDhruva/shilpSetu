-- ==============================================================================
-- ShilpSetu Database Migration: Explore & Search Backend Functionality
-- Migration: explore_search_filters.sql (20261113120000_explore_search_filters.sql)
-- ==============================================================================

-- 1. Ensure Reviews Table Structure
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating numeric(2, 1) not null check (rating >= 1.0 and rating <= 5.0),
  comment text,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint uq_review_user_product unique (user_id, product_id)
);

create index if not exists idx_reviews_product_published on public.reviews(product_id, is_published);
create index if not exists idx_reviews_user on public.reviews(user_id);

-- 2. Ensure Cart Items Table (cart_items)
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint uq_cart_user_product unique (user_id, product_id)
);

create index if not exists idx_cart_items_user on public.cart_items(user_id);

-- 3. Optimized Search & Filtering Indexes on Products
create index if not exists idx_products_name_trgm on public.products using btree (name);
create index if not exists idx_products_price on public.products(price);
create index if not exists idx_products_active_stock on public.products(is_active, stock);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_products_category_name on public.products(category_name);

-- 4. Dynamic Product Reviews Aggregate View (Fast rating calculation without N+1)
create or replace view public.product_ratings_view as
select
  p.id as product_id,
  round(avg(r.rating)::numeric, 1) as avg_rating,
  count(r.id)::integer as total_reviews
from public.products p
left join public.reviews r
  on p.id = r.product_id and r.is_published = true
group by p.id;

-- 5. Stored Function: search_and_filter_products
-- Provides multi-faceted search, advanced filtering, and sorting
create or replace function public.search_and_filter_products(
  p_query text default null,
  p_category text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_in_stock_only boolean default true,
  p_min_rating numeric default null,
  p_sort_by text default 'popular',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  artisan_id uuid,
  artisan_name text,
  name text,
  description text,
  price numeric,
  original_price numeric,
  rating numeric,
  reviews_count integer,
  category_name text,
  image_url text,
  image_urls text[],
  tags text[],
  is_featured boolean,
  is_curated boolean,
  is_active boolean,
  stock integer,
  created_at timestamptz,
  artisan_business_name text,
  artisan_specialty text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_term text := null;
begin
  if p_query is not null and trim(p_query) <> '' then
    v_term := '%' || lower(trim(p_query)) || '%';
  end if;

  return query
  select
    p.id,
    p.artisan_id,
    coalesce(ap.business_name, prof.full_name, p.artisan_name, 'Skilled Indian Artisan') as artisan_name,
    p.name,
    p.description,
    p.price,
    p.original_price,
    coalesce(prv.avg_rating, p.rating, null) as rating,
    coalesce(prv.total_reviews, p.reviews_count, 0) as reviews_count,
    coalesce(p.category_name, p.category, 'Handicrafts') as category_name,
    p.image_url,
    coalesce(p.image_urls, array[]::text[]) as image_urls,
    coalesce(p.tags, array[]::text[]) as tags,
    coalesce(p.is_featured, false) as is_featured,
    coalesce(p.is_curated, false) as is_curated,
    p.is_active,
    p.stock,
    p.created_at,
    ap.business_name as artisan_business_name,
    ap.craft_specialty as artisan_specialty
  from public.products p
  left join public.artisan_profiles ap on p.artisan_id = ap.user_id
  left join public.profiles prof on p.artisan_id = prof.id
  left join public.product_ratings_view prv on p.id = prv.product_id
  where
    -- Active condition
    p.is_active = true
    -- In stock filter condition
    and (not p_in_stock_only or coalesce(p.stock, 0) > 0)
    -- Price filters
    and (p_min_price is null or p.price >= p_min_price)
    and (p_max_price is null or p.price <= p_max_price)
    -- Category filter
    and (
      p_category is null
      or lower(trim(p_category)) = 'all'
      or lower(coalesce(p.category_name, p.category, '')) ilike '%' || lower(trim(p_category)) || '%'
    )
    -- Text search matching product name, description, category, tags, or artisan
    and (
      v_term is null
      or lower(p.name) like v_term
      or lower(coalesce(p.description, '')) like v_term
      or lower(coalesce(p.category_name, p.category, '')) like v_term
      or lower(coalesce(p.artisan_name, '')) like v_term
      or lower(coalesce(ap.business_name, '')) like v_term
      or lower(coalesce(prof.full_name, '')) like v_term
      or exists (
        select 1 from unnest(coalesce(p.tags, array[]::text[])) tag
        where lower(tag) like v_term
      )
    )
    -- Rating filter
    and (
      p_min_rating is null
      or coalesce(prv.avg_rating, p.rating, 0) >= p_min_rating
    )
  order by
    case when p_sort_by = 'price_low_high' then p.price end asc,
    case when p_sort_by = 'price_high_low' then p.price end desc,
    case when p_sort_by = 'newest' then p.created_at end desc,
    case when p_sort_by = 'highest_rated' then coalesce(prv.avg_rating, p.rating, 0) end desc,
    -- Default 'popular': reviews count desc, then rating desc, then created_at desc
    coalesce(prv.total_reviews, p.reviews_count, 0) desc,
    coalesce(prv.avg_rating, p.rating, 0) desc,
    p.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- 6. Stored Function: add_to_cart_item
-- Authenticated atomic cart upsert with stock bounds checking
create or replace function public.add_to_cart_item(
  p_product_id uuid,
  p_quantity integer default 1
)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_stock integer;
  v_is_active boolean;
  v_current_qty integer := 0;
  v_new_qty integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Authentication required');
  end if;

  if p_quantity <= 0 then
    return json_build_object('success', false, 'error', 'Quantity must be greater than zero');
  end if;

  -- Verify product existence and stock
  select stock, is_active into v_stock, v_is_active
  from public.products
  where id = p_product_id;

  if not found then
    return json_build_object('success', false, 'error', 'Product not found');
  end if;

  if not v_is_active then
    return json_build_object('success', false, 'error', 'Product is currently unavailable');
  end if;

  -- Check existing cart quantity
  select quantity into v_current_qty
  from public.cart_items
  where user_id = v_user_id and product_id = p_product_id;

  v_current_qty := coalesce(v_current_qty, 0);
  v_new_qty := v_current_qty + p_quantity;

  if v_stock is not null and v_new_qty > v_stock then
    return json_build_object(
      'success', false,
      'error', format('Only %s item(s) available in stock', v_stock),
      'available_stock', v_stock,
      'current_quantity', v_current_qty
    );
  end if;

  -- Upsert cart item
  insert into public.cart_items (user_id, product_id, quantity, updated_at)
  values (v_user_id, p_product_id, v_new_qty, timezone('utc'::text, now()))
  on conflict (user_id, product_id)
  do update set
    quantity = v_new_qty,
    updated_at = timezone('utc'::text, now());

  return json_build_object(
    'success', true,
    'product_id', p_product_id,
    'quantity', v_new_qty
  );
end;
$$;

-- 7. Row Level Security for Reviews and Cart Items
alter table public.reviews enable row level security;
alter table public.cart_items enable row level security;

-- Reviews RLS
drop policy if exists "Published reviews are viewable by everyone" on public.reviews;
create policy "Published reviews are viewable by everyone"
  on public.reviews for select
  using (is_published = true);

drop policy if exists "Authenticated users can create reviews" on public.reviews;
create policy "Authenticated users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Cart Items RLS (Strict user isolation)
drop policy if exists "Users can view own cart items" on public.cart_items;
create policy "Users can view own cart items"
  on public.cart_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cart items" on public.cart_items;
create policy "Users can insert own cart items"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cart items" on public.cart_items;
create policy "Users can update own cart items"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cart items" on public.cart_items;
create policy "Users can delete own cart items"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- Grant execute permissions to authenticated and anon users
grant execute on function public.search_and_filter_products to anon, authenticated;
grant execute on function public.add_to_cart_item to authenticated;

