-- ==============================================================================
-- ShilpSetu Database Migration: manage_products_backend.sql
-- ==============================================================================
-- Backend functionality required for Manage Products page:
-- 1. Performance Indexes for artisan product filtering, sorting and stats
-- 2. Strict RLS Policies on public.products for authenticated artisans:
--    - SELECT: Only view own products (artisan_id = auth.uid()) or active products for customers
--    - INSERT: Only insert own products (artisan_id = auth.uid())
--    - UPDATE: Only update own products (artisan_id = auth.uid())
--    - DELETE: Only delete own products (artisan_id = auth.uid())
-- 3. Inventory Statistics RPC: get_artisan_inventory_stats_rpc()
--    - Dynamically computes Total, In Stock (> 5), Low Stock (1-5), Out of Stock (<= 0)
-- 4. Manage Artisan Products RPC: manage_artisan_products_rpc()
--    - Filters by query (name, category, tags) and stock status
--    - Sorts by newest, oldest, price_low, price_high, name_az, stock_low
--    - Supports pagination
-- 5. Duplicate Product RPC: duplicate_artisan_product_rpc()
--    - Clones product details, category, tags, and image URLs
--    - Appends " (Copy)" to the product name
--    - Sets new stock_quantity = 0 initially (as required)
-- 6. Update Artisan Stock RPC: update_artisan_stock_rpc()
--    - Validates non-negative stock and updates stock + stock_quantity + updated_at
-- ==============================================================================

-- 1. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_artisan_stock_qty ON public.products(artisan_id, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_artisan_created_at ON public.products(artisan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_artisan_category_name ON public.products(artisan_id, category);
CREATE INDEX IF NOT EXISTS idx_products_artisan_price ON public.products(artisan_id, price);
CREATE INDEX IF NOT EXISTS idx_products_artisan_name ON public.products(artisan_id, name);

-- 2. Strict Row Level Security (RLS) on public.products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2a. SELECT Policy
DROP POLICY IF EXISTS "Artisans can view own products or public active products" ON public.products;
CREATE POLICY "Artisans can view own products or public active products"
  ON public.products FOR SELECT
  USING (
    -- Artisan can view all their own products (active or draft)
    (auth.uid() IS NOT NULL AND artisan_id = auth.uid())
    OR
    -- Customers/public can only view active products with stock > 0
    (coalesce(is_active, true) = true AND coalesce(stock_quantity, stock, 0) > 0)
  );

-- 2b. INSERT Policy: Only authenticated user can insert products where artisan_id = auth.uid()
DROP POLICY IF EXISTS "Artisans can insert own products" ON public.products;
CREATE POLICY "Artisans can insert own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    artisan_id = auth.uid()
  );

-- 2c. UPDATE Policy: Only authenticated artisan can update their own products
DROP POLICY IF EXISTS "Artisans can update own products" ON public.products;
CREATE POLICY "Artisans can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    artisan_id = auth.uid()
  )
  WITH CHECK (
    artisan_id = auth.uid()
  );

-- 2d. DELETE Policy: Only authenticated artisan can delete their own products
DROP POLICY IF EXISTS "Artisans can delete own products" ON public.products;
CREATE POLICY "Artisans can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    artisan_id = auth.uid()
  );

-- 3. Dynamic Inventory Statistics RPC
-- Returns exact counts: total, in_stock (> 5), low_stock (1..5), out_of_stock (<= 0)
CREATE OR REPLACE FUNCTION public.get_artisan_inventory_stats_rpc()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_total integer := 0;
  v_in_stock integer := 0;
  v_low_stock integer := 0;
  v_out_of_stock integer := 0;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE coalesce(stock_quantity, stock, 0) > 5),
    count(*) FILTER (WHERE coalesce(stock_quantity, stock, 0) BETWEEN 1 AND 5),
    count(*) FILTER (WHERE coalesce(stock_quantity, stock, 0) <= 0)
  INTO
    v_total,
    v_in_stock,
    v_low_stock,
    v_out_of_stock
  FROM public.products
  WHERE artisan_id = v_artisan_id
    AND coalesce(is_active, true) = true;

  RETURN jsonb_build_object(
    'success', true,
    'total', coalesce(v_total, 0),
    'in_stock', coalesce(v_in_stock, 0),
    'low_stock', coalesce(v_low_stock, 0),
    'out_of_stock', coalesce(v_out_of_stock, 0)
  );
END;
$$;

-- 4. Manage Artisan Products RPC
-- Searches name/category/tags, filters stock tab, sorts, and paginates for auth.uid()
CREATE OR REPLACE FUNCTION public.manage_artisan_products_rpc(
  p_query text DEFAULT NULL,
  p_filter text DEFAULT 'all',      -- 'all', 'in_stock', 'low_stock', 'out_of_stock'
  p_sort text DEFAULT 'newest',     -- 'newest', 'oldest', 'price_low', 'price_high', 'name_az', 'stock_low'
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_result jsonb;
  v_total_count integer := 0;
  v_clean_query text;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  v_clean_query := NULLIF(trim(p_query), '');

  -- CTE to filter and count matching rows
  WITH filtered AS (
    SELECT
      p.id,
      coalesce(p.product_name, p.name) AS name,
      coalesce(p.product_name, p.name) AS product_name,
      p.description,
      coalesce(p.category, p.category_name, 'Handicrafts') AS category,
      coalesce(p.category, p.category_name, 'Handicrafts') AS category_name,
      p.category_id,
      p.price,
      coalesce(p.stock_quantity, p.stock, 0) AS stock,
      coalesce(p.stock_quantity, p.stock, 0) AS stock_quantity,
      p.image_urls,
      coalesce(p.image_url, CASE WHEN array_length(p.image_urls, 1) > 0 THEN p.image_urls[1] ELSE NULL END) AS image_url,
      p.tags,
      p.is_active,
      p.created_at,
      p.updated_at,
      p.artisan_id,
      CASE
        WHEN coalesce(p.stock_quantity, p.stock, 0) <= 0 THEN 'out_of_stock'
        WHEN coalesce(p.stock_quantity, p.stock, 0) <= 5 THEN 'low_stock'
        ELSE 'in_stock'
      END AS stock_status
    FROM public.products p
    WHERE p.artisan_id = v_artisan_id
      AND coalesce(p.is_active, true) = true
      -- Search query
      AND (
        v_clean_query IS NULL
        OR p.product_name ILIKE '%' || v_clean_query || '%'
        OR p.name ILIKE '%' || v_clean_query || '%'
        OR p.category ILIKE '%' || v_clean_query || '%'
        OR (p.tags IS NOT NULL AND array_to_string(p.tags, ' ') ILIKE '%' || v_clean_query || '%')
      )
      -- Stock tab filter
      AND (
        p_filter IS NULL OR p_filter = 'all'
        OR (p_filter = 'in_stock' AND coalesce(p.stock_quantity, p.stock, 0) > 5)
        OR (p_filter = 'low_stock' AND coalesce(p.stock_quantity, p.stock, 0) BETWEEN 1 AND 5)
        OR (p_filter = 'out_of_stock' AND coalesce(p.stock_quantity, p.stock, 0) <= 0)
      )
  ),
  total_recs AS (
    SELECT count(*)::integer AS total FROM filtered
  ),
  sorted AS (
    SELECT *
    FROM filtered
    ORDER BY
      CASE WHEN p_sort = 'oldest' THEN created_at END ASC,
      CASE WHEN p_sort = 'price_low' THEN price END ASC,
      CASE WHEN p_sort = 'price_high' THEN price END DESC,
      CASE WHEN p_sort = 'name_az' THEN lower(name) END ASC,
      CASE WHEN p_sort = 'stock_low' THEN stock END ASC,
      -- default: newest
      created_at DESC
    LIMIT coalesce(p_limit, 50)
    OFFSET coalesce(p_offset, 0)
  )
  SELECT
    jsonb_build_object(
      'success', true,
      'total', (SELECT coalesce(total, 0) FROM total_recs),
      'products', coalesce(jsonb_agg(to_jsonb(sorted)), '[]'::jsonb)
    )
  INTO v_result
  FROM sorted;

  RETURN coalesce(v_result, jsonb_build_object('success', true, 'total', 0, 'products', '[]'::jsonb));
END;
$$;

-- 5. Duplicate Artisan Product RPC
-- Clones existing product, preserves ownership, appends (Copy), and initializes stock to 0
CREATE OR REPLACE FUNCTION public.duplicate_artisan_product_rpc(
  p_product_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_source RECORD;
  v_new_id uuid;
  v_copy_name text;
  v_new_record RECORD;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  -- 1. Verify existence and ownership
  SELECT *
  INTO v_source
  FROM public.products
  WHERE id = p_product_id
    AND artisan_id = v_artisan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found or access denied.');
  END IF;

  -- 2. Format copy name
  v_copy_name := coalesce(v_source.product_name, v_source.name, 'Handmade Craft');
  IF v_copy_name NOT LIKE '%(Copy)%' THEN
    v_copy_name := v_copy_name || ' (Copy)';
  END IF;

  -- 3. Insert duplicate with initial stock = 0
  INSERT INTO public.products (
    artisan_id,
    name,
    product_name,
    description,
    category,
    category_id,
    price,
    stock,
    stock_quantity,
    image_url,
    image_urls,
    tags,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_artisan_id,
    v_copy_name,
    v_copy_name,
    v_source.description,
    v_source.category,
    v_source.category_id,
    v_source.price,
    0, -- Initial stock set to 0 as required
    0,
    v_source.image_url,
    coalesce(v_source.image_urls, ARRAY[]::text[]),
    coalesce(v_source.tags, ARRAY[]::text[]),
    true,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  RETURNING * INTO v_new_record;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Product duplicated successfully with initial stock 0.',
    'product', to_jsonb(v_new_record)
  );
END;
$$;

-- 6. Update Artisan Stock RPC
-- Validates non-negative integer, verifies ownership, updates stock and stock_quantity
CREATE OR REPLACE FUNCTION public.update_artisan_stock_rpc(
  p_product_id uuid,
  p_new_stock integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_updated RECORD;
  v_status text;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  IF p_new_stock IS NULL OR p_new_stock < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stock quantity cannot be negative.');
  END IF;

  -- Update row
  UPDATE public.products
  SET
    stock = p_new_stock,
    stock_quantity = p_new_stock,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id
    AND artisan_id = v_artisan_id
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found or access denied.');
  END IF;

  IF p_new_stock <= 0 THEN
    v_status := 'out_of_stock';
  ELSIF p_new_stock <= 5 THEN
    v_status := 'low_stock';
  ELSE
    v_status := 'in_stock';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Stock updated successfully.',
    'product_id', p_product_id,
    'new_stock', p_new_stock,
    'stock_status', v_status,
    'updated_at', v_updated.updated_at
  );
END;
$$;
