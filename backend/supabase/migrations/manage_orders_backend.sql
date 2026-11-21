-- ==============================================================================
-- ShilpSetu Database Migration: manage_orders_backend.sql
-- ==============================================================================
-- Complete Backend Functionality for Artisan Manage Orders
--
-- Features:
-- 1. Multi-Artisan Independent Fulfillment Table: public.artisan_order_fulfillments
--    - When a customer places an order containing items from multiple artisans,
--      each artisan gets their own fulfillment record.
--    - Each artisan can independently:
--      * Accept order (pending -> processing)
--      * Cancel their items with reason & atomic stock restoration (pending -> cancelled)
--      * Ship order with courier name, tracking number, and tracking URL (processing -> shipped)
--      * Update tracking information (courier, tracking #, URL)
--      * Mark as delivered (shipped -> delivered)
--    - Auto-synced trigger computes overall order.order_status safely without
--      cross-artisan pollution.
-- 2. Performance indexes on orders, order_items, artisan_order_fulfillments, profiles
-- 3. Strict Row Level Security (RLS) on all order and fulfillment tables:
--    - Customers only access their own orders (customer_id = auth.uid())
--    - Artisans only access orders containing their products (artisan_id = auth.uid())
--    - Artisans can only mutate their own fulfillment records (artisan_id = auth.uid())
-- 4. Dynamic Order Statistics RPC: get_artisan_manage_order_stats_rpc()
--    - Calculates Total Orders, Pending, Processing, Shipped, Delivered, Cancelled
--    - Based strictly on authenticated artisan's items (no duplicate order inflation)
-- 5. Manage Orders Retrieval RPC: get_artisan_manage_orders_rpc(...)
--    - Searches order_number, customer full_name, and product_name
--    - Filters by status ('all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled')
--    - Filters by date range, payment status, min/max price
--    - Sorts newest / oldest
--    - Supports pagination (limit, offset)
-- 6. Atomic State Transition RPCs:
--    - artisan_accept_order_rpc(p_order_id)
--    - artisan_cancel_order_rpc(p_order_id, p_cancellation_reason)
--    - artisan_mark_order_shipped_rpc(p_order_id, p_courier_name, p_tracking_number, p_tracking_url)
--    - artisan_update_tracking_rpc(p_order_id, p_courier_name, p_tracking_number, p_tracking_url)
-- 7. Secure Order Details Query RPC: get_artisan_order_details_rpc(p_order_id)
-- ==============================================================================

-- 1. Ensure columns on public.orders & public.order_items
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS artisan_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_name_snapshot text,
  ADD COLUMN IF NOT EXISTS product_image_snapshot text,
  ADD COLUMN IF NOT EXISTS unit_price numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS item_status text DEFAULT 'pending' CHECK (item_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- 2. Multi-Artisan Independent Fulfillment Table
CREATE TABLE IF NOT EXISTS public.artisan_order_fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  artisan_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fulfillment_status text NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  items_subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  courier_name text,
  tracking_number text,
  tracking_url text,
  accepted_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_artisan_order_fulfillment UNIQUE (order_id, artisan_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_artisan_fulfillments_artisan_id ON public.artisan_order_fulfillments(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_fulfillments_order_id ON public.artisan_order_fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_artisan_fulfillments_status ON public.artisan_order_fulfillments(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_artisan_id ON public.order_items(artisan_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);

-- Backfill fulfillments from existing order_items if any exist without fulfillments
DO $$
BEGIN
  INSERT INTO public.artisan_order_fulfillments (
    order_id,
    artisan_id,
    fulfillment_status,
    items_subtotal,
    created_at,
    updated_at
  )
  SELECT
    oi.order_id,
    COALESCE(oi.artisan_id, p.artisan_id) AS artisan_id,
    COALESCE(o.order_status, 'pending') AS fulfillment_status,
    COALESCE(SUM(COALESCE(oi.total_price, oi.price * oi.quantity, 0)), 0) AS items_subtotal,
    MIN(o.created_at),
    timezone('utc'::text, now())
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE COALESCE(oi.artisan_id, p.artisan_id) IS NOT NULL
  GROUP BY oi.order_id, COALESCE(oi.artisan_id, p.artisan_id), o.order_status
  ON CONFLICT (order_id, artisan_id) DO NOTHING;
END $$;

-- 3. Row Level Security (RLS) on orders, order_items, and artisan_order_fulfillments
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_order_fulfillments ENABLE ROW LEVEL SECURITY;

-- 3a. Orders Policies
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Artisans can view orders containing their products" ON public.orders;
CREATE POLICY "Artisans can view orders containing their products"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_order_fulfillments aof
      WHERE aof.order_id = public.orders.id AND aof.artisan_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.order_items oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = public.orders.id AND (oi.artisan_id = auth.uid() OR p.artisan_id = auth.uid())
    )
  );

-- 3b. Order Items Policies
DROP POLICY IF EXISTS "Customers can view items of own orders" ON public.order_items;
CREATE POLICY "Customers can view items of own orders"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = public.order_items.order_id AND (o.customer_id = auth.uid() OR o.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Artisans can view own order items" ON public.order_items;
CREATE POLICY "Artisans can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    artisan_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = public.order_items.product_id AND p.artisan_id = auth.uid()
    )
  );

-- 3c. Artisan Order Fulfillments Policies
DROP POLICY IF EXISTS "Artisans can view own fulfillments" ON public.artisan_order_fulfillments;
CREATE POLICY "Artisans can view own fulfillments"
  ON public.artisan_order_fulfillments FOR SELECT
  TO authenticated
  USING (artisan_id = auth.uid());

DROP POLICY IF EXISTS "Artisans can update own fulfillments" ON public.artisan_order_fulfillments;
CREATE POLICY "Artisans can update own fulfillments"
  ON public.artisan_order_fulfillments FOR UPDATE
  TO authenticated
  USING (artisan_id = auth.uid())
  WITH CHECK (artisan_id = auth.uid());

-- 4. Trigger to synchronize overall order status when all artisan fulfillments update
CREATE OR REPLACE FUNCTION public.sync_order_fulfillment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_distinct_statuses text[];
  v_new_order_status text;
BEGIN
  -- Aggregate distinct statuses for all fulfillments in this order
  SELECT array_agg(DISTINCT fulfillment_status)
  INTO v_distinct_statuses
  FROM public.artisan_order_fulfillments
  WHERE order_id = NEW.order_id;

  IF v_distinct_statuses = ARRAY['delivered']::text[] THEN
    v_new_order_status := 'delivered';
  ELSIF v_distinct_statuses = ARRAY['cancelled']::text[] THEN
    v_new_order_status := 'cancelled';
  ELSIF 'shipped' = ANY(v_distinct_statuses) OR 'delivered' = ANY(v_distinct_statuses) THEN
    v_new_order_status := 'shipped';
  ELSIF 'processing' = ANY(v_distinct_statuses) THEN
    v_new_order_status := 'processing';
  ELSE
    v_new_order_status := 'pending';
  END IF;

  UPDATE public.orders
  SET
    order_status = v_new_order_status,
    status = v_new_order_status,
    updated_at = timezone('utc'::text, now())
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_fulfillment_status ON public.artisan_order_fulfillments;
CREATE TRIGGER trg_sync_order_fulfillment_status
AFTER INSERT OR UPDATE OF fulfillment_status ON public.artisan_order_fulfillments
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_fulfillment_status();

-- 5. RPC: get_artisan_manage_order_stats_rpc()
-- Computes real dynamic order counts strictly for auth.uid()
CREATE OR REPLACE FUNCTION public.get_artisan_manage_order_stats_rpc()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_total integer := 0;
  v_pending integer := 0;
  v_processing integer := 0;
  v_shipped integer := 0;
  v_delivered integer := 0;
  v_cancelled integer := 0;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT
    COUNT(DISTINCT aof.order_id),
    COUNT(DISTINCT aof.order_id) FILTER (WHERE aof.fulfillment_status IN ('pending', 'new', 'confirmed')),
    COUNT(DISTINCT aof.order_id) FILTER (WHERE aof.fulfillment_status = 'processing'),
    COUNT(DISTINCT aof.order_id) FILTER (WHERE aof.fulfillment_status IN ('shipped', 'packed', 'out_for_delivery')),
    COUNT(DISTINCT aof.order_id) FILTER (WHERE aof.fulfillment_status IN ('delivered', 'completed')),
    COUNT(DISTINCT aof.order_id) FILTER (WHERE aof.fulfillment_status IN ('cancelled', 'refunded'))
  INTO
    v_total,
    v_pending,
    v_processing,
    v_shipped,
    v_delivered,
    v_cancelled
  FROM public.artisan_order_fulfillments aof
  WHERE aof.artisan_id = v_artisan_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_orders', coalesce(v_total, 0),
    'pending', coalesce(v_pending, 0),
    'processing', coalesce(v_processing, 0),
    'shipped', coalesce(v_shipped, 0),
    'delivered', coalesce(v_delivered, 0),
    'cancelled', coalesce(v_cancelled, 0)
  );
END;
$$;

-- 6. RPC: get_artisan_manage_orders_rpc(...)
-- Securely retrieves orders containing the artisan's products with customer, address, and item details
CREATE OR REPLACE FUNCTION public.get_artisan_manage_orders_rpc(
  p_status text DEFAULT 'all',
  p_search text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_sort text DEFAULT 'newest',
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
  v_clean_search text;
  v_result jsonb;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  v_clean_search := NULLIF(trim(p_search), '');

  WITH artisan_matches AS (
    SELECT
      aof.order_id,
      aof.fulfillment_status,
      aof.courier_name,
      aof.tracking_number,
      aof.tracking_url,
      aof.accepted_at,
      aof.shipped_at,
      aof.delivered_at,
      aof.cancellation_reason,
      aof.cancelled_at,
      aof.items_subtotal,
      o.order_number,
      o.created_at,
      o.payment_method,
      o.payment_status,
      o.total_amount,
      o.delivery_fee,
      o.discount_amount,
      prof.full_name AS customer_full_name,
      prof.phone AS customer_phone,
      prof.email AS customer_email,
      COALESCE(
        o.delivery_address,
        (SELECT to_jsonb(ca) FROM public.customer_addresses ca WHERE ca.id = o.address_id LIMIT 1)
      ) AS shipping_address
    FROM public.artisan_order_fulfillments aof
    JOIN public.orders o ON o.id = aof.order_id
    LEFT JOIN public.profiles prof ON prof.id = COALESCE(o.customer_id, o.user_id)
    WHERE aof.artisan_id = v_artisan_id
      -- Status filter
      AND (
        p_status IS NULL OR p_status = 'all'
        OR (p_status = 'pending' AND aof.fulfillment_status IN ('pending', 'new', 'confirmed'))
        OR (p_status = 'processing' AND aof.fulfillment_status = 'processing')
        OR (p_status = 'shipped' AND aof.fulfillment_status IN ('shipped', 'packed', 'out_for_delivery'))
        OR (p_status = 'delivered' AND aof.fulfillment_status IN ('delivered', 'completed'))
        OR (p_status = 'cancelled' AND aof.fulfillment_status IN ('cancelled', 'refunded'))
        OR aof.fulfillment_status = p_status
      )
      -- Search filter
      AND (
        v_clean_search IS NULL
        OR o.order_number ILIKE '%' || v_clean_search || '%'
        OR prof.full_name ILIKE '%' || v_clean_search || '%'
        OR EXISTS (
          SELECT 1 FROM public.order_items oi
          LEFT JOIN public.products p ON p.id = oi.product_id
          WHERE oi.order_id = aof.order_id
            AND (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
            AND (oi.product_name_snapshot ILIKE '%' || v_clean_search || '%' OR p.name ILIKE '%' || v_clean_search || '%')
        )
      )
      -- Date Range
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at <= p_end_date)
      -- Payment Status
      AND (p_payment_status IS NULL OR p_payment_status = 'all' OR o.payment_status = p_payment_status)
      -- Price Range
      AND (p_min_price IS NULL OR aof.items_subtotal >= p_min_price)
      AND (p_max_price IS NULL OR aof.items_subtotal <= p_max_price)
  ),
  total_count_cte AS (
    SELECT count(*)::integer AS total FROM artisan_matches
  ),
  sorted_matches AS (
    SELECT *
    FROM artisan_matches
    ORDER BY
      CASE WHEN p_sort = 'oldest' THEN created_at END ASC,
      created_at DESC
    LIMIT coalesce(p_limit, 50)
    OFFSET coalesce(p_offset, 0)
  ),
  aggregated_orders AS (
    SELECT
      sm.order_id AS id,
      sm.order_number,
      sm.created_at,
      sm.fulfillment_status AS status,
      sm.fulfillment_status AS order_status,
      sm.payment_method,
      sm.payment_status,
      sm.items_subtotal AS subtotal,
      COALESCE(sm.discount_amount, 0) AS discount_amount,
      COALESCE(sm.delivery_fee, 0) AS delivery_fee,
      sm.items_subtotal AS total_amount,
      sm.courier_name,
      sm.tracking_number,
      sm.tracking_url,
      sm.accepted_at,
      sm.shipped_at,
      sm.delivered_at,
      sm.cancellation_reason,
      sm.cancelled_at,
      jsonb_build_object(
        'full_name', coalesce(sm.customer_full_name, 'Valued Customer'),
        'phone', sm.customer_phone,
        'email', sm.customer_email
      ) AS customer,
      sm.shipping_address,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', coalesce(oi.product_name_snapshot, p.product_name, p.name, 'Artisan Craft'),
            'image_url', coalesce(
              oi.product_image_snapshot,
              p.image_url,
              CASE WHEN array_length(p.image_urls, 1) > 0 THEN p.image_urls[1] ELSE NULL END
            ),
            'quantity', oi.quantity,
            'unit_price', coalesce(oi.unit_price, oi.price, 0),
            'total_price', coalesce(oi.total_price, oi.price * oi.quantity, 0),
            'category', coalesce(p.category, 'Handicrafts')
          )
        )
        FROM public.order_items oi
        LEFT JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = sm.order_id
          AND (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
      ) AS items
    FROM sorted_matches sm
  )
  SELECT
    jsonb_build_object(
      'success', true,
      'total', (SELECT coalesce(total, 0) FROM total_count_cte),
      'orders', coalesce(jsonb_agg(to_jsonb(ao)), '[]'::jsonb)
    )
  INTO v_result
  FROM aggregated_orders ao;

  RETURN coalesce(v_result, jsonb_build_object('success', true, 'total', 0, 'orders', '[]'::jsonb));
END;
$$;

-- 7. Atomic Status Action: Accept Order (Pending -> Processing)
CREATE OR REPLACE FUNCTION public.artisan_accept_order_rpc(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_current_status text;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Verify existence and current pending status for this artisan
  SELECT fulfillment_status
  INTO v_current_status
  FROM public.artisan_order_fulfillments
  WHERE order_id = p_order_id AND artisan_id = v_artisan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fulfillment record not found or access denied');
  END IF;

  IF v_current_status NOT IN ('pending', 'new', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot accept order. Current status is ' || v_current_status);
  END IF;

  -- Update artisan fulfillment
  UPDATE public.artisan_order_fulfillments
  SET
    fulfillment_status = 'processing',
    accepted_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id AND artisan_id = v_artisan_id;

  -- Update order item statuses
  UPDATE public.order_items
  SET item_status = 'processing', accepted_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id AND (artisan_id = v_artisan_id OR product_id IN (
    SELECT id FROM public.products WHERE artisan_id = v_artisan_id
  ));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order accepted successfully and is now in processing.',
    'order_id', p_order_id,
    'status', 'processing'
  );
END;
$$;

-- 8. Atomic Status Action: Mark as Shipped (Processing -> Shipped)
CREATE OR REPLACE FUNCTION public.artisan_mark_order_shipped_rpc(
  p_order_id uuid,
  p_courier_name text,
  p_tracking_number text,
  p_tracking_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_current_status text;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_courier_name IS NULL OR trim(p_courier_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Courier name is required');
  END IF;
  IF p_tracking_number IS NULL OR trim(p_tracking_number) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking number is required');
  END IF;

  SELECT fulfillment_status
  INTO v_current_status
  FROM public.artisan_order_fulfillments
  WHERE order_id = p_order_id AND artisan_id = v_artisan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fulfillment record not found or access denied');
  END IF;

  IF v_current_status NOT IN ('processing', 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order must be in processing to be marked as shipped');
  END IF;

  -- Update artisan fulfillment
  UPDATE public.artisan_order_fulfillments
  SET
    fulfillment_status = 'shipped',
    courier_name = trim(p_courier_name),
    tracking_number = trim(p_tracking_number),
    tracking_url = NULLIF(trim(p_tracking_url), ''),
    shipped_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id AND artisan_id = v_artisan_id;

  -- Update order items
  UPDATE public.order_items
  SET
    item_status = 'shipped',
    courier_name = trim(p_courier_name),
    tracking_number = trim(p_tracking_number),
    tracking_url = NULLIF(trim(p_tracking_url), ''),
    shipped_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id AND (artisan_id = v_artisan_id OR product_id IN (
    SELECT id FROM public.products WHERE artisan_id = v_artisan_id
  ));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order marked as shipped successfully.',
    'order_id', p_order_id,
    'status', 'shipped',
    'courier_name', trim(p_courier_name),
    'tracking_number', trim(p_tracking_number)
  );
END;
$$;

-- 9. Atomic Status Action: Update Tracking Information
CREATE OR REPLACE FUNCTION public.artisan_update_tracking_rpc(
  p_order_id uuid,
  p_courier_name text,
  p_tracking_number text,
  p_tracking_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.artisan_order_fulfillments
    WHERE order_id = p_order_id AND artisan_id = v_artisan_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fulfillment record not found or access denied');
  END IF;

  UPDATE public.artisan_order_fulfillments
  SET
    courier_name = coalesce(NULLIF(trim(p_courier_name), ''), courier_name),
    tracking_number = coalesce(NULLIF(trim(p_tracking_number), ''), tracking_number),
    tracking_url = coalesce(NULLIF(trim(p_tracking_url), ''), tracking_url),
    updated_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id AND artisan_id = v_artisan_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Shipping tracking details updated successfully.',
    'order_id', p_order_id
  );
END;
$$;

-- 10. Atomic Status Action: Cancel Order & Restore Stock
CREATE OR REPLACE FUNCTION public.artisan_cancel_order_rpc(
  p_order_id uuid,
  p_cancellation_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_current_status text;
  v_item RECORD;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_cancellation_reason IS NULL OR trim(p_cancellation_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cancellation reason is required');
  END IF;

  SELECT fulfillment_status
  INTO v_current_status
  FROM public.artisan_order_fulfillments
  WHERE order_id = p_order_id AND artisan_id = v_artisan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fulfillment record not found or access denied');
  END IF;

  -- Prohibit cancelling orders that are already shipped, delivered, or already cancelled
  IF v_current_status IN ('shipped', 'delivered', 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel order in status: ' || v_current_status);
  END IF;

  -- 1. Update fulfillment status
  UPDATE public.artisan_order_fulfillments
  SET
    fulfillment_status = 'cancelled',
    cancellation_reason = trim(p_cancellation_reason),
    cancelled_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id AND artisan_id = v_artisan_id;

  -- 2. Update order items
  UPDATE public.order_items
  SET
    item_status = 'cancelled',
    cancellation_reason = trim(p_cancellation_reason),
    cancelled_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id AND (artisan_id = v_artisan_id OR product_id IN (
    SELECT id FROM public.products WHERE artisan_id = v_artisan_id
  ));

  -- 3. Safely restore stock only for this artisan's items
  FOR v_item IN
    SELECT oi.product_id, oi.quantity
    FROM public.order_items oi
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
  LOOP
    IF v_item.product_id IS NOT NULL THEN
      UPDATE public.products
      SET
        stock = COALESCE(stock, 0) + v_item.quantity,
        stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity,
        updated_at = timezone('utc'::text, now())
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order cancelled and item inventory restored successfully.',
    'order_id', p_order_id,
    'status', 'cancelled'
  );
END;
$$;

-- 11. Trigger to automatically create artisan_order_fulfillments when order_items are inserted
CREATE OR REPLACE FUNCTION public.create_artisan_fulfillment_on_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_artisan_id uuid;
BEGIN
  v_artisan_id := NEW.artisan_id;
  IF v_artisan_id IS NULL THEN
    SELECT artisan_id INTO v_artisan_id FROM public.products WHERE id = NEW.product_id;
  END IF;

  IF v_artisan_id IS NOT NULL THEN
    INSERT INTO public.artisan_order_fulfillments (
      order_id,
      artisan_id,
      fulfillment_status,
      items_subtotal,
      created_at,
      updated_at
    ) VALUES (
      NEW.order_id,
      v_artisan_id,
      'pending',
      COALESCE(NEW.total_price, NEW.price * NEW.quantity, 0),
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    ON CONFLICT (order_id, artisan_id) DO UPDATE SET
      items_subtotal = public.artisan_order_fulfillments.items_subtotal + COALESCE(NEW.total_price, NEW.price * NEW.quantity, 0),
      updated_at = timezone('utc'::text, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_artisan_fulfillment_on_item ON public.order_items;
CREATE TRIGGER trg_create_artisan_fulfillment_on_item
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.create_artisan_fulfillment_on_item();

-- 12. Secure Order Details Query RPC

CREATE OR REPLACE FUNCTION public.get_artisan_order_details_rpc(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_order jsonb;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT to_jsonb(sub)
  INTO v_order
  FROM (
    SELECT
      o.id,
      o.order_number,
      o.created_at,
      o.updated_at,
      aof.fulfillment_status AS status,
      aof.fulfillment_status AS order_status,
      o.payment_method,
      o.payment_status,
      aof.items_subtotal AS subtotal,
      COALESCE(o.discount_amount, 0) AS discount_amount,
      COALESCE(o.delivery_fee, 0) AS delivery_fee,
      aof.items_subtotal AS total_amount,
      aof.courier_name,
      aof.tracking_number,
      aof.tracking_url,
      aof.accepted_at,
      aof.shipped_at,
      aof.delivered_at,
      aof.cancellation_reason,
      aof.cancelled_at,
      jsonb_build_object(
        'full_name', coalesce(prof.full_name, 'Valued Customer'),
        'phone', prof.phone,
        'email', prof.email
      ) AS customer,
      COALESCE(
        o.delivery_address,
        (SELECT to_jsonb(ca) FROM public.customer_addresses ca WHERE ca.id = o.address_id LIMIT 1)
      ) AS shipping_address,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', coalesce(oi.product_name_snapshot, p.product_name, p.name, 'Artisan Craft'),
            'image_url', coalesce(
              oi.product_image_snapshot,
              p.image_url,
              CASE WHEN array_length(p.image_urls, 1) > 0 THEN p.image_urls[1] ELSE NULL END
            ),
            'quantity', oi.quantity,
            'unit_price', coalesce(oi.unit_price, oi.price, 0),
            'total_price', coalesce(oi.total_price, oi.price * oi.quantity, 0),
            'category', coalesce(p.category, 'Handicrafts')
          )
        )
        FROM public.order_items oi
        LEFT JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = o.id
          AND (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
      ) AS items
    FROM public.orders o
    JOIN public.artisan_order_fulfillments aof ON aof.order_id = o.id AND aof.artisan_id = v_artisan_id
    LEFT JOIN public.profiles prof ON prof.id = COALESCE(o.customer_id, o.user_id)
    WHERE o.id = p_order_id
  ) sub;

  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or unauthorized');
  END IF;

  RETURN jsonb_build_object('success', true, 'order', v_order);
END;
$$;
