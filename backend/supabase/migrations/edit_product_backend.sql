-- ==============================================================================
-- ShilpSetu Database Migration: edit_product_backend.sql
-- ==============================================================================
-- Backend functionality required for editing existing artisan products:
-- 1. Verify and strengthen RLS policies on public.products:
--    - Authenticated artisans can only view & update their own products
--    - Protected fields (artisan_id, id, created_at) cannot be mutated
--    - Customers can only read active products with stock > 0
-- 2. Storage policies on 'product-images' bucket:
--    - Artisans can upload and delete files only within their own artisan folder:
--      product-images/{artisan_id}/{productId}/{filename}
--    - Public read access for customers
-- 3. Atomic RPC Functions:
--    - get_artisan_product_by_id_rpc(p_product_id)
--      Securely retrieves an artisan's product verifying ownership or active status
--    - update_product_rpc(...)
--      Atomic server-side validation and update of editable product fields
--      Enforces price > 0, stock >= 0, max 5 images, description <= 300 chars
--      Preserves artisan_id ownership and auto-updates updated_at
-- ==============================================================================

-- 1. Ensure Table Structure and Constraints
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- Constraints
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
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_updated_at_desc ON public.products(updated_at DESC);

-- 2. Storage Policies for product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png'];

-- 2a. Public read access
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 2b. Authenticated Artisans Upload Access (Artisan's own folder)
DROP POLICY IF EXISTS "Artisans can upload product images into own folder" ON storage.objects;
CREATE POLICY "Artisans can upload product images into own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2c. Authenticated Artisans Update Access in own folder
DROP POLICY IF EXISTS "Artisans can update own product images" ON storage.objects;
CREATE POLICY "Artisans can update own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2d. Authenticated Artisans Delete Access in own folder
DROP POLICY IF EXISTS "Artisans can delete own product images" ON storage.objects;
CREATE POLICY "Artisans can delete own product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Row Level Security on public.products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3a. Read policy: Customers see active in-stock products; Artisans see all their own products
DROP POLICY IF EXISTS "Active products are viewable by customers" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by customers"
  ON public.products FOR SELECT
  USING (
    (is_active = true AND coalesce(stock, 0) > 0)
    OR (auth.uid() IS NOT NULL AND auth.uid() = artisan_id)
  );

-- 3b. Update policy: Authenticated artisans can only update their own products and cannot alter artisan_id
DROP POLICY IF EXISTS "Artisans can update own products" ON public.products;
CREATE POLICY "Artisans can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = artisan_id)
  WITH CHECK (
    auth.uid() = artisan_id
    AND artisan_id = (SELECT p.artisan_id FROM public.products p WHERE p.id = id)
  );

-- 3c. Delete policy: Only product owner can delete
DROP POLICY IF EXISTS "Artisans can delete own products" ON public.products;
CREATE POLICY "Artisans can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = artisan_id);

-- 4. RPC: get_artisan_product_by_id_rpc
-- Authenticated retrieval of product details for editing, enforcing ownership check
CREATE OR REPLACE FUNCTION public.get_artisan_product_by_id_rpc(p_product_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_prod public.products%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required. Please log in first.'
    );
  END IF;

  SELECT * INTO v_prod
  FROM public.products
  WHERE id::text = p_product_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found.'
    );
  END IF;

  -- Ensure caller owns this product (or is an active admin)
  IF v_prod.artisan_id IS NOT NULL AND v_prod.artisan_id <> v_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized. You can only view or edit your own products.'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'product', json_build_object(
      'id', v_prod.id,
      'artisan_id', v_prod.artisan_id,
      'artisan_name', v_prod.artisan_name,
      'product_name', coalesce(v_prod.product_name, v_prod.name),
      'name', coalesce(v_prod.product_name, v_prod.name),
      'category', coalesce(v_prod.category, v_prod.category_name, 'Pottery & Ceramics'),
      'category_id', v_prod.category_id,
      'price', v_prod.price,
      'stock_quantity', coalesce(v_prod.stock_quantity, v_prod.stock, 0),
      'stock', coalesce(v_prod.stock_quantity, v_prod.stock, 0),
      'description', v_prod.description,
      'image_urls', v_prod.image_urls,
      'image_url', v_prod.image_url,
      'tags', coalesce(v_prod.tags, ARRAY[]::text[]),
      'is_active', coalesce(v_prod.is_active, true),
      'created_at', v_prod.created_at,
      'updated_at', v_prod.updated_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_artisan_product_by_id_rpc(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_artisan_product_by_id_rpc(text) TO authenticated;

-- 5. RPC: update_product_rpc
-- Secure, server-side atomic update with complete validation
CREATE OR REPLACE FUNCTION public.update_product_rpc(
  p_product_id text,
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
  v_is_artisan boolean;
  v_existing public.products%ROWTYPE;
  v_category_id uuid;
  v_updated public.products%ROWTYPE;
  v_primary_image text;
BEGIN
  -- 1. Authentication Check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required. Please log in first.'
    );
  END IF;

  -- 2. Verify caller has artisan role
  SELECT (role = 'artisan') INTO v_is_artisan
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND OR v_is_artisan IS NOT TRUE THEN
    IF EXISTS (SELECT 1 FROM public.artisan_profiles WHERE user_id = v_user_id) THEN
      v_is_artisan := true;
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Access denied. Only registered artisans can update products.'
      );
    END IF;
  END IF;

  -- 3. Verify Product Exists
  SELECT * INTO v_existing
  FROM public.products
  WHERE id::text = p_product_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found.'
    );
  END IF;

  -- 4. Verify Ownership: caller must be the artisan who owns the product
  IF v_existing.artisan_id IS NOT NULL AND v_existing.artisan_id <> v_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized. You cannot edit another artisan''s product.'
    );
  END IF;

  -- 5. Validations
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

  -- Resolve category_id if found
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE name ILIKE p_category OR slug ILIKE p_category
  LIMIT 1;

  v_primary_image := p_image_urls[1];

  -- 6. Perform the Update (Preserving artisan_id, id, and created_at)
  UPDATE public.products
  SET
    name = trim(p_product_name),
    product_name = trim(p_product_name),
    category = trim(p_category),
    category_name = trim(p_category),
    category_id = coalesce(v_category_id, v_existing.category_id),
    price = p_price,
    stock = p_stock_quantity,
    stock_quantity = p_stock_quantity,
    description = trim(p_description),
    image_url = v_primary_image,
    image_urls = p_image_urls,
    tags = coalesce(p_tags, ARRAY[]::text[]),
    updated_at = timezone('utc'::text, now())
  WHERE id = v_existing.id
  RETURNING * INTO v_updated;

  RETURN json_build_object(
    'success', true,
    'message', 'Product updated successfully!',
    'product', json_build_object(
      'id', v_updated.id,
      'product_name', v_updated.product_name,
      'name', v_updated.name,
      'category', v_updated.category,
      'price', v_updated.price,
      'stock_quantity', v_updated.stock_quantity,
      'stock', v_updated.stock,
      'description', v_updated.description,
      'image_urls', v_updated.image_urls,
      'image_url', v_updated.image_url,
      'tags', v_updated.tags,
      'artisan_id', v_updated.artisan_id,
      'artisan_name', v_updated.artisan_name,
      'is_active', v_updated.is_active,
      'created_at', v_updated.created_at,
      'updated_at', v_updated.updated_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_product_rpc(text, text, text, numeric, integer, text, text[], text[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_product_rpc(text, text, text, numeric, integer, text, text[], text[]) TO authenticated;

