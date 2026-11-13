-- ==============================================================================
-- ShilpSetu Database Migration: Products, Categories & Wishlist
-- ==============================================================================

-- 1. Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon_name text,
  display_order integer default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 2. Create products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid references auth.users(id) on delete set null,
  artisan_name text not null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  original_price numeric(10, 2),
  rating numeric(3, 2) default 4.8,
  reviews_count integer default 0,
  category_id uuid references public.categories(id) on delete set null,
  category_name text,
  image_url text,
  is_featured boolean default false,
  is_curated boolean default true,
  is_active boolean default true,
  stock integer default 10,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_products_curated on public.products(is_curated);
create index if not exists idx_products_name on public.products(name);

-- 3. Create wishlist table
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint uq_wishlist_user_product unique(user_id, product_id)
);

create index if not exists idx_wishlist_user on public.wishlist(user_id);

-- 4. Row Level Security
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.wishlist enable row level security;

-- Categories: readable by everyone
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

-- Products: active products viewable by everyone
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
  on public.products for select using (is_active = true);

-- Wishlist: users manage their own wishlist
drop policy if exists "Users can view own wishlist" on public.wishlist;
create policy "Users can view own wishlist"
  on public.wishlist for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add to own wishlist" on public.wishlist;
create policy "Users can add to own wishlist"
  on public.wishlist for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove from own wishlist" on public.wishlist;
create policy "Users can remove from own wishlist"
  on public.wishlist for delete
  to authenticated
  using (auth.uid() = user_id);

-- 5. Seed initial Categories & Products
insert into public.categories (name, slug, icon_name, display_order)
values
  ('Pottery', 'pottery', 'pottery', 1),
  ('Textiles', 'textiles', 'textiles', 2),
  ('Jewellery', 'jewellery', 'jewellery', 3),
  ('Home Decor', 'home-decor', 'homedecor', 4),
  ('More', 'more', 'more', 5)
on conflict (slug) do nothing;

insert into public.products (name, artisan_name, price, original_price, rating, reviews_count, category_name, is_featured, is_curated, image_url)
values
  ('Handcarved Rosewood Elephant', 'Master Rameshwar Rao', 2499.00, 2999.00, 4.9, 128, 'Woodcrafts', true, true, 'col-woodcrafts'),
  ('Chanderi Zari Silk Saree', 'Devi Handlooms Varanasi', 4850.00, 5999.00, 4.8, 94, 'Handlooms', true, true, 'col-handlooms'),
  ('Traditional Kundan Jhumkas', 'Kundan Heritage Jaipur', 1899.00, 2400.00, 4.9, 215, 'Accessories', true, true, 'col-accessories'),
  ('Terracotta Painted Matka Set', 'Kumhar Craft Collective', 1299.00, 1699.00, 4.7, 76, 'Pottery', true, true, 'banner-pottery'),
  ('Brass Peacock Diya Pair', 'Swarna Shilp Thanjavur', 1650.00, 2100.00, 4.9, 142, 'Home Decor', false, true, 'col-woodcrafts'),
  ('Blue Pottery Floral Vase', 'Jaipur Blue Glaze Art', 1450.00, 1800.00, 4.8, 88, 'Pottery', false, true, 'banner-pottery')
on conflict do nothing;

