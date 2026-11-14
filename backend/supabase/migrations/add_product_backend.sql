-- ==============================================================================
-- ShilpSetu Database Migration: add_product_backend.sql
-- ==============================================================================
-- 1. Ensure products table supports all required columns:
--    id, artisan_id, product_name, category_id, category, description, price,
--    stock_quantity, image_urls, tags, is_active, created_at, updated_at
-- 2. Ensure categories table has default active craft categories
-- 3. Configure Supabase Storage bucket 'product-images' and strict RLS policies
-- 4. Set up strict RLS policies on public.products:
--    - Authenticated artisans only can insert products for themselves
--    - Ownership cannot be forged or transferred to another user
--    - Customers can only read active products
-- 5. RPC create_product_rpc() for secure atomic product creation with validation
-- ==============================================================================

-- 1. Ensure Products Table and Columns
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  artisan_name text,
  name text,
  description text,
  price numeric(10, 2) NOT NULL,
  original_price numeric(10, 2),
  rating numeric(3, 2) DEFAULT 5.0,
  reviews_count integer DEFAULT 0,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name text,
  category text,
  image_url text,
  image_urls text[] DEFAULT ARRAY[]::text[],
  tags text[] DEFAULT ARRAY[]::text[],
  is_featured boolean DEFAULT false,
  is_curated boolean DEFAULT true,
  is_active boolean DEFAULT true,
  stock integer DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all required columns exist with backward-compatible aliases
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_curated boolean DEFAULT true;

-- Keep name & product_name and stock & stock_quantity in sync
CREATE OR REPLACE FUNCTION public.sync_product_field_aliases()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sync name <-> product_name
  IF NEW.product_name IS NOT NULL AND (NEW.name IS NULL OR NEW.name = '') THEN
    NEW.name := NEW.product_name;
  ELSIF NEW.name IS NOT NULL AND (NEW.product_name IS NULL OR NEW.product_name = '') THEN
    NEW.product_name := NEW.name;
  END IF;

  -- Sync stock <-> stock_quantity
  IF NEW.stock_quantity IS NOT NULL AND NEW.stock IS NULL THEN
    NEW.stock := NEW.stock_quantity;
  ELSIF NEW.stock IS NOT NULL AND NEW.stock_quantity IS NULL THEN
    NEW.stock_quantity := NEW.stock;
  END IF;

  -- Sync category <-> category_name
  IF NEW.category IS NOT NULL AND NEW.category_name IS NULL THEN
    NEW.category_name := NEW.category;
  ELSIF NEW.category_name IS NOT NULL AND NEW.category IS NULL THEN
    NEW.category := NEW.category_name;
  END IF;

  -- Sync image_url with first element of image_urls
  IF (NEW.image_url IS NULL OR NEW.image_url = '') AND array_length(NEW.image_urls, 1) > 0 THEN
    NEW.image_url := NEW.image_urls[1];
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_product_field_aliases ON public.products;
CREATE TRIGGER tr_sync_product_field_aliases
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_field_aliases();

-- Constraints on products table
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS check_product_price_positive;
ALTER TABLE public.products
  ADD CONSTRAINT check_product_price_positive
  CHECK (price > 0);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS check_product_stock_non_negative;
ALTER TABLE public.products
  ADD CONSTRAINT check_product_stock_non_negative
  CHECK (coalesce(stock, 0) >= 0 AND coalesce(stock_quantity, 0) >= 0);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_artisan_id ON public.products(artisan_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON public.products(created_at DESC);

-- 2. Categories Table & Standard Initial Seed Data
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon_name text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

INSERT INTO public.categories (name, slug, description, icon_name, display_order, is_active)
VALUES
  ('Pottery & Ceramics', 'pottery-ceramics', 'Handcrafted terracotta, clay pots, and glazed ceramic art.', '🏺', 1, true),
  ('Textiles & Handlooms', 'textiles-handlooms', 'Authentic handwoven stoles, sarees, shawls, and fabrics.', '🧵', 2, true),
  ('Jewellery', 'jewellery', 'Traditional handcrafted Kundan, Meenakari, and tribal jewellery.', '✨', 3, true),
  ('Woodcrafts', 'woodcrafts', 'Carved rosewood, teak figurines, and wooden decorative idols.', '🪵', 4, true),
  ('Home Decor', 'home-decor', 'Handmade brass lamps, wall hangings, and artisanal table decor.', '🏮', 5, true),
  ('Paintings', 'paintings', 'Madhubani, Pattachitra, Warli, and traditional folk paintings.', '🎨', 6, true),
  ('Accessories', 'accessories', 'Handmade leather crafts, juttis, pouches, and artisanal accessories.', '📿', 7, true),
  ('Other', 'other', 'Miscellaneous traditional rural crafts and handmade artefacts.', '📦', 8, true)
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  icon_name = EXCLUDED.icon_name,
  is_active = true;

-- 3. Storage Bucket Configuration: 'product-images'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png'];

-- Storage Policies for product-images
-- 3a. Public Read Access
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3b. Authenticated Artisans Upload Access (Artisan-specific folder)
DROP POLICY IF EXISTS "Artisans can upload product images into own folder" ON storage.objects;
CREATE POLICY "Artisans can upload product images into own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3c. Authenticated Artisans Update Access in own folder
DROP POLICY IF EXISTS "Artisans can update own product images" ON storage.objects;
CREATE POLICY "Artisans can update own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3d. Authenticated Artisans Delete Access in own folder
DROP POLICY IF EXISTS "Artisans can delete own product images" ON storage.objects;
CREATE POLICY "Artisans can delete own product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Products Table RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories RLS: Read active categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (coalesce(is_active, true) = true);

-- Products RLS:
-- 4a. Public / Customers can read active products with stock > 0, artisans can read all their own products
DROP POLICY IF EXISTS "Active products are viewable by customers" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by customers"
  ON public.products FOR SELECT
  USING (
    (is_active = true AND coalesce(stock, 0) > 0)
    OR (auth.uid() IS NOT NULL AND auth.uid() = artisan_id)
  );

-- 4b. Insert policy: Only authenticated artisans can insert products for themselves
DROP POLICY IF EXISTS "Artisans can insert own products" ON public.products;
CREATE POLICY "Artisans can insert own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = artisan_id
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'artisan'
    )
  );

-- 4c. Update policy: Artisans can only update their own products and cannot change artisan_id
DROP POLICY IF EXISTS "Artisans can update own products" ON public.products;
CREATE POLICY "Artisans can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = artisan_id)
  WITH CHECK (
    auth.uid() = artisan_id
    AND artisan_id = (SELECT p.artisan_id FROM public.products p WHERE p.id = id)
  );

-- 4d. Delete policy: Artisans can only delete their own products
DROP POLICY IF EXISTS "Artisans can delete own products" ON public.products;
CREATE POLICY "Artisans can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = artisan_id);

-- 5. RPC create_product_rpc: Atomic, validated server-side product creation
CREATE OR REPLACE FUNCTION public.create_product_rpc(
  p_product_name text,
  p_category text,
  p_price numeric,
  p_stock_quantity integer,
  p_description text,
  p_image_urls text[],
  p_tags text[] DEFAULT ARRAY[]::text[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_artisan_name text;
  v_is_artisan boolean;
  v_category_id uuid;
  v_new_product public.products%ROWTYPE;
BEGIN
  -- 1. Authentication Check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required. Please log in first.'
    );
  END IF;

  -- 2. Role Check: verify user is an active artisan
  SELECT (role = 'artisan'), coalesce(full_name, 'Master Artisan')
  INTO v_is_artisan, v_artisan_name
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND OR v_is_artisan IS NOT TRUE THEN
    -- Check if record exists in artisan_profiles
    IF EXISTS (SELECT 1 FROM public.artisan_profiles WHERE user_id = v_user_id) THEN
      v_is_artisan := true;
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Access denied. Only registered artisans can create products.'
      );
    END IF;
  END IF;

  -- 3. Input Validation
  IF p_product_name IS NULL OR trim(p_product_name) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Product name is required.');
  END IF;

  IF p_price IS NULL OR p_price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Price must be greater than zero.');
  END IF;

  IF p_stock_quantity IS NULL OR p_stock_quantity < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Stock quantity must be a non-negative integer.');
  END IF;

  IF p_description IS NULL OR trim(p_description) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Product description is required.');
  END IF;

  IF length(trim(p_description)) > 300 THEN
    RETURN json_build_object('success', false, 'error', 'Product description must not exceed 300 characters.');
  END IF;

  IF p_image_urls IS NULL OR array_length(p_image_urls, 1) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'At least one product image is required.');
  END IF;

  IF array_length(p_image_urls, 1) > 5 THEN
    RETURN json_build_object('success', false, 'error', 'A product can have at most 5 images.');
  END IF;

  -- Find category_id if available
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE name ILIKE p_category OR slug ILIKE p_category
  LIMIT 1;

  -- 4. Insert Product with trusted artisan_id derived from auth.uid()
  INSERT INTO public.products (
    artisan_id,
    artisan_name,
    name,
    product_name,
    description,
    price,
    stock,
    stock_quantity,
    category,
    category_name,
    category_id,
    image_url,
    image_urls,
    tags,
    is_active,
    is_curated,
    is_featured,
    rating,
    reviews_count,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_artisan_name,
    trim(p_product_name),
    trim(p_product_name),
    trim(p_description),
    p_price,
    p_stock_quantity,
    p_stock_quantity,
    trim(p_category),
    trim(p_category),
    v_category_id,
    p_image_urls[1],
    p_image_urls,
    coalesce(p_tags, ARRAY[]::text[]),
    true,
    true,
    false,
    5.0,
    0,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  RETURNING * INTO v_new_product;

  RETURN json_build_object(
    'success', true,
    'message', 'Product created successfully!',
    'product', json_build_object(
      'id', v_new_product.id,
      'product_name', v_new_product.product_name,
      'name', v_new_product.name,
      'category', v_new_product.category,
      'price', v_new_product.price,
      'stock_quantity', v_new_product.stock_quantity,
      'description', v_new_product.description,
      'image_urls', v_new_product.image_urls,
      'tags', v_new_product.tags,
      'artisan_id', v_new_product.artisan_id,
      'artisan_name', v_new_product.artisan_name,
      'is_active', v_new_product.is_active,
      'created_at', v_new_product.created_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_product_rpc(text, text, numeric, integer, text, text[], text[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_product_rpc(text, text, numeric, integer, text, text[], text[]) TO authenticated;

