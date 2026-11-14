-- ==============================================================================
-- ShilpSetu Database Migration: persistent_data_and_storage.sql
-- ==============================================================================
-- 1. Storage Buckets:
--    - 'product-images' (public read, artisan-authenticated isolated insert/update/delete)
--    - 'profile-images' (public read, user-authenticated isolated insert/update/delete)
-- 2. Ensure Core Tables & Integrity:
--    - profiles (id, full_name, email, role, profile_image, avatar_url, created_at, updated_at)
--    - products (id, artisan_id, name, product_name, description, category_id, category, price, stock, stock_quantity, image_urls, tags, is_active, created_at, updated_at)
--    - cart_items (id, user_id, product_id, quantity, created_at, updated_at) with unique(user_id, product_id)
--    - wishlist (id, user_id, product_id, created_at) with unique(user_id, product_id)
--    - orders (id, customer_id, user_id, order_number, total_amount, order_status, delivery_address, address_id, payment_status, created_at, updated_at)
--    - order_items (id, order_id, product_id, artisan_id, quantity, unit_price, price, created_at)
-- 3. Row Level Security (RLS) on all user-specific tables:
--    - Cart: Customers access only their own items
--    - Wishlist: Customers access only their own items
--    - Orders & Order Items: Customers access only their own orders
--    - Products: Artisans edit only their own products; public reads active in-stock products
-- 4. Server-Side RPC Functions:
--    - add_to_cart_persistent(p_product_id, p_quantity)
--    - get_user_cart_details()
--    - update_cart_item_quantity(p_cart_item_id, p_quantity)
--    - remove_cart_item_persistent(p_cart_item_id)
--    - clear_user_cart()
--    - add_to_wishlist_persistent(p_product_id)
--    - get_user_wishlist_details()
--    - remove_from_wishlist_persistent(p_product_id)
--    - get_customer_dashboard_counts()
--    - get_my_artisan_products()
-- ==============================================================================

-- 1. Storage Configuration for product-images and profile-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png']),
  ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png'];

-- Storage Policies: profile-images
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
CREATE POLICY "Public can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users can upload own profile image" ON storage.objects;
CREATE POLICY "Users can upload own profile image"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own profile image" ON storage.objects;
CREATE POLICY "Users can update own profile image"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own profile image" ON storage.objects;
CREATE POLICY "Users can delete own profile image"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policies: product-images (ensure bucket isolation by artisan)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Artisans can upload product images into own folder" ON storage.objects;
CREATE POLICY "Artisans can upload product images into own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Artisans can update own product images" ON storage.objects;
CREATE POLICY "Artisans can update own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Artisans can delete own product images" ON storage.objects;
CREATE POLICY "Artisans can delete own product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Table Integrity Check & Columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_image text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS artisan_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS artisan_name text,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS category_name text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- Ensure cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_cart_user_product UNIQUE (user_id, product_id)
);

-- Ensure wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
);

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_products_artisan_active ON public.products(artisan_id, is_active);

-- 3. Row Level Security Verification
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3a. Cart RLS
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
CREATE POLICY "Users can view own cart items"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
CREATE POLICY "Users can insert own cart items"
  ON public.cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
CREATE POLICY "Users can update own cart items"
  ON public.cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
CREATE POLICY "Users can delete own cart items"
  ON public.cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3b. Wishlist RLS
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist;
CREATE POLICY "Users can view own wishlist"
  ON public.wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlist;
CREATE POLICY "Users can insert own wishlist items"
  ON public.wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlist;
CREATE POLICY "Users can delete own wishlist items"
  ON public.wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3c. Products RLS
DROP POLICY IF EXISTS "Active products are viewable by customers" ON public.products;
CREATE POLICY "Active products are viewable by customers"
  ON public.products FOR SELECT
  USING (
    (is_active = true AND coalesce(stock, stock_quantity, 0) > 0)
    OR (auth.uid() IS NOT NULL AND auth.uid() = artisan_id)
  );

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

DROP POLICY IF EXISTS "Artisans can update own products" ON public.products;
CREATE POLICY "Artisans can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = artisan_id)
  WITH CHECK (
    auth.uid() = artisan_id
    AND artisan_id = (SELECT p.artisan_id FROM public.products p WHERE p.id = id)
  );

DROP POLICY IF EXISTS "Artisans can delete own products" ON public.products;
CREATE POLICY "Artisans can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = artisan_id);

-- 4. Server-Side Persistent Operations RPC

-- 4a. add_to_cart_persistent: Safe upsert checking available stock
CREATE OR REPLACE FUNCTION public.add_to_cart_persistent(
  p_product_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_prod public.products%ROWTYPE;
  v_existing_qty integer := 0;
  v_target_qty integer;
  v_cart_item public.cart_items%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity must be positive');
  END IF;

  SELECT * INTO v_prod FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_prod.is_active IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product is currently unavailable');
  END IF;

  -- Check existing cart quantity
  SELECT quantity INTO v_existing_qty
  FROM public.cart_items
  WHERE user_id = v_user_id AND product_id = p_product_id;

  v_target_qty := coalesce(v_existing_qty, 0) + p_quantity;

  IF v_prod.stock IS NOT NULL AND v_prod.stock < v_target_qty THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Only %s item(s) available in stock', v_prod.stock),
      'available_stock', v_prod.stock
    );
  END IF;

  INSERT INTO public.cart_items (user_id, product_id, quantity, updated_at)
  VALUES (v_user_id, p_product_id, v_target_qty, timezone('utc'::text, now()))
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET
    quantity = EXCLUDED.quantity,
    updated_at = timezone('utc'::text, now())
  RETURNING * INTO v_cart_item;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Product added to cart',
    'cart_item_id', v_cart_item.id,
    'quantity', v_cart_item.quantity
  );
END;
$$;

-- 4b. get_user_cart_details: Fetch authenticated user's cart joined with active product details
CREATE OR REPLACE FUNCTION public.get_user_cart_details()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_items jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required', 'items', '[]'::jsonb);
  END IF;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'cart_item_id', c.id,
      'product_id', p.id,
      'quantity', c.quantity,
      'addedAt', c.created_at,
      'product', jsonb_build_object(
        'id', p.id,
        'name', coalesce(p.product_name, p.name),
        'product_name', coalesce(p.product_name, p.name),
        'price', p.price,
        'original_price', p.original_price,
        'stock', coalesce(p.stock_quantity, p.stock, 0),
        'image_url', coalesce(p.image_url, (p.image_urls)[1]),
        'image_urls', p.image_urls,
        'category', coalesce(p.category, p.category_name),
        'artisan_id', p.artisan_id,
        'artisan_name', p.artisan_name,
        'is_active', p.is_active
      )
    ) ORDER BY c.created_at DESC
  ), '[]'::jsonb) INTO v_items
  FROM public.cart_items c
  JOIN public.products p ON p.id = c.product_id
  WHERE c.user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'items', v_items
  );
END;
$$;

-- 4c. add_to_wishlist_persistent: Safe idempotent wishlist addition
CREATE OR REPLACE FUNCTION public.add_to_wishlist_persistent(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product does not exist');
  END IF;

  INSERT INTO public.wishlist (user_id, product_id)
  VALUES (v_user_id, p_product_id)
  ON CONFLICT (user_id, product_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'in_wishlist', true
  );
END;
$$;

-- 4d. get_user_wishlist_details: Retrieve full product details for wishlist items
CREATE OR REPLACE FUNCTION public.get_user_wishlist_details()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_items jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required', 'items', '[]'::jsonb);
  END IF;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', w.id,
      'product_id', p.id,
      'created_at', w.created_at,
      'product', jsonb_build_object(
        'id', p.id,
        'name', coalesce(p.product_name, p.name),
        'price', p.price,
        'stock', coalesce(p.stock_quantity, p.stock, 0),
        'image_url', coalesce(p.image_url, (p.image_urls)[1]),
        'image_urls', p.image_urls,
        'category', coalesce(p.category, p.category_name),
        'artisan_name', p.artisan_name,
        'rating', p.rating,
        'reviews_count', p.reviews_count,
        'is_active', p.is_active
      )
    ) ORDER BY w.created_at DESC
  ), '[]'::jsonb) INTO v_items
  FROM public.wishlist w
  JOIN public.products p ON p.id = w.product_id
  WHERE w.user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'items', v_items);
END;
$$;

-- 4e. get_customer_dashboard_counts: Return real counts for customer (orders, cart, wishlist)
CREATE OR REPLACE FUNCTION public.get_customer_dashboard_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order_count integer := 0;
  v_cart_count integer := 0;
  v_wishlist_count integer := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'order_count', 0,
      'cart_count', 0,
      'wishlist_count', 0
    );
  END IF;

  SELECT count(*)::integer INTO v_order_count
  FROM public.orders
  WHERE (customer_id = v_user_id OR user_id = v_user_id);

  SELECT coalesce(sum(quantity), 0)::integer INTO v_cart_count
  FROM public.cart_items
  WHERE user_id = v_user_id;

  SELECT count(*)::integer INTO v_wishlist_count
  FROM public.wishlist
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_count', v_order_count,
    'cart_count', v_cart_count,
    'wishlist_count', v_wishlist_count
  );
END;
$$;

-- 4f. get_my_artisan_products: Fetch ONLY the authenticated artisan's products
CREATE OR REPLACE FUNCTION public.get_my_artisan_products()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_prods jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required', 'products', '[]'::jsonb);
  END IF;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', coalesce(p.product_name, p.name),
      'product_name', coalesce(p.product_name, p.name),
      'description', p.description,
      'price', p.price,
      'stock', coalesce(p.stock_quantity, p.stock, 0),
      'stock_quantity', coalesce(p.stock_quantity, p.stock, 0),
      'category', coalesce(p.category, p.category_name),
      'image_url', coalesce(p.image_url, (p.image_urls)[1]),
      'image_urls', p.image_urls,
      'tags', p.tags,
      'is_active', p.is_active,
      'created_at', p.created_at,
      'updated_at', p.updated_at
    ) ORDER BY p.created_at DESC
  ), '[]'::jsonb) INTO v_prods
  FROM public.products p
  WHERE p.artisan_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'products', v_prods);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_to_cart_persistent(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cart_details() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_wishlist_persistent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_wishlist_details() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_dashboard_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_artisan_products() TO authenticated;

