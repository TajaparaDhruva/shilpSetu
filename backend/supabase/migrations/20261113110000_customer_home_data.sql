-- ==============================================================================
-- ShilpSetu Database Migration: Customer Home Page Data & Schema Updates
-- Migration: customer_home_data.sql (20261113110000_customer_home_data.sql)
-- ==============================================================================

-- 1. Ensure Categories Table supports all required fields and categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  image_url text,
  icon_name text,
  is_active boolean not null default true,
  display_order integer default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Add any missing columns to existing categories table
alter table public.categories add column if not exists image_url text;
alter table public.categories add column if not exists is_active boolean not null default true;
alter table public.categories add column if not exists display_order integer default 0;

create index if not exists idx_categories_active_order on public.categories(is_active, display_order);

-- 2. Ensure Collections & Collection Products Tables
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  display_order integer default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_collections_active_order on public.collections(is_active, display_order);

create table if not exists public.collection_products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  display_order integer default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint uq_collection_product unique (collection_id, product_id)
);

create index if not exists idx_collection_products_collection on public.collection_products(collection_id);

-- 3. Ensure Products Table has all required fields
-- Required: id, artisan_id, name, description, category, price, stock, image_urls, tags, is_active, is_featured, rating, created_at
alter table public.products add column if not exists image_urls text[] default array[]::text[];
alter table public.products add column if not exists tags text[] default array[]::text[];
alter table public.products add column if not exists category text;
alter table public.products add column if not exists is_curated boolean default true;
alter table public.products alter column is_active set default true;
alter table public.products alter column stock set default 10;

-- Backfill category from category_name if null
update public.products set category = category_name where category is null and category_name is not null;

-- Comprehensive indexes on products
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_artisan_id on public.products(artisan_id);
create index if not exists idx_products_is_active on public.products(is_active);
create index if not exists idx_products_is_featured on public.products(is_featured);
create index if not exists idx_products_curated on public.products(is_curated);
create index if not exists idx_products_active_stock on public.products(is_active, stock);

-- 4. Ensure Wishlist Table
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint uq_wishlist_user_product unique(user_id, product_id)
);

create index if not exists idx_wishlist_user on public.wishlist(user_id);
create index if not exists idx_wishlist_user_product on public.wishlist(user_id, product_id);

-- 5. Row Level Security Policies
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.products enable row level security;
alter table public.wishlist enable row level security;

-- Categories RLS
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (is_active = true);

-- Collections RLS
drop policy if exists "Collections are viewable by everyone" on public.collections;
create policy "Collections are viewable by everyone"
  on public.collections for select
  using (is_active = true);

-- Collection Products RLS
drop policy if exists "Collection products are viewable by everyone" on public.collection_products;
create policy "Collection products are viewable by everyone"
  on public.collection_products for select
  using (true);

-- Products RLS: Customers and public only see active products with stock > 0 (or artisans see their own)
drop policy if exists "Active products are viewable by customers" on public.products;
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Active products are viewable by customers"
  on public.products for select
  using (
    (is_active = true and coalesce(stock, 0) > 0)
    or (auth.uid() is not null and auth.uid() = artisan_id)
  );

-- Artisans can manage their own products
drop policy if exists "Artisans can insert own products" on public.products;
create policy "Artisans can insert own products"
  on public.products for insert
  to authenticated
  with check (auth.uid() = artisan_id);

drop policy if exists "Artisans can update own products" on public.products;
create policy "Artisans can update own products"
  on public.products for update
  to authenticated
  using (auth.uid() = artisan_id)
  with check (auth.uid() = artisan_id);

drop policy if exists "Artisans can delete own products" on public.products;
create policy "Artisans can delete own products"
  on public.products for delete
  to authenticated
  using (auth.uid() = artisan_id);

-- Wishlist RLS: Strictly owner-only
drop policy if exists "Users can view own wishlist" on public.wishlist;
create policy "Users can view own wishlist"
  on public.wishlist for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add to own wishlist" on public.wishlist;
create policy "Users can add to own wishlist"
  on public.wishlist for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.products
      where id = product_id and is_active = true
    )
  );

drop policy if exists "Users can remove from own wishlist" on public.wishlist;
create policy "Users can remove from own wishlist"
  on public.wishlist for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. Seed initial Categories & Collections
insert into public.categories (name, slug, icon_name, is_active, display_order)
values
  ('Pottery', 'pottery', 'pottery', true, 1),
  ('Textiles', 'textiles', 'textiles', true, 2),
  ('Jewellery', 'jewellery', 'jewellery', true, 3),
  ('Home Decor', 'home-decor', 'homedecor', true, 4),
  ('Woodcrafts', 'woodcrafts', 'woodcrafts', true, 5),
  ('Accessories', 'accessories', 'accessories', true, 6),
  ('More', 'more', 'more', true, 7)
on conflict (slug) do update set
  is_active = excluded.is_active,
  display_order = excluded.display_order;

insert into public.collections (name, slug, description, image_url, is_active, display_order)
values
  ('Woodcrafts', 'woodcrafts', 'Exquisite handcarved wooden marvels and heritage statuettes.', 'col-woodcrafts', true, 1),
  ('Handlooms', 'handlooms', 'Pure silk, cotton brocade, and authentic tribal weaves.', 'col-handlooms', true, 2),
  ('Accessories', 'accessories', 'Handmade brass, kundan jewellery, and traditional accessories.', 'col-accessories', true, 3)
on conflict (slug) do update set
  is_active = excluded.is_active,
  display_order = excluded.display_order;

-- Associate initial products into collection_products if products exist
insert into public.collection_products (collection_id, product_id, display_order)
select c.id, p.id, 1
from public.collections c
join public.products p on lower(p.name) like '%' || lower(c.name) || '%' or lower(coalesce(p.category, p.category_name, '')) like '%' || lower(c.name) || '%'
on conflict (collection_id, product_id) do nothing;

