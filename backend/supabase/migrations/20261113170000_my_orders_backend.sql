-- ==============================================================================
-- ShilpSetu Database Migration: My Orders Backend Functionality
-- File: my_orders_backend.sql (20261113170000_my_orders_backend.sql)
--
-- Features:
--   1. order_status_history table with tracking events & constraints
--   2. Order columns enhancements: tracking_step, cancellation_reason, cancelled_at
--   3. Review table enhancements: order_id reference, verified purchase constraint
--   4. Optimized indexes for customer order retrieval, status filters, and reviews
--   5. Secure RPC Functions:
--      - get_customer_orders(p_status, p_page, p_limit)
--      - get_order_details(p_order_id)
--      - get_order_tracking(p_order_id)
--      - get_customer_order_counts()
--      - request_order_cancellation(p_order_id, p_reason)
--      - get_eligible_review_products(p_order_id)
--      - submit_product_review_atomic(p_product_id, p_order_id, p_rating, p_comment)
--      - get_order_review_status(p_order_id)
--   6. RLS Policies for secure customer, artisan and system access
-- ==============================================================================

-- 1. Ensure order_status_history table exists
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('ordered', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'return_requested')),
  description TEXT NOT NULL,
  location TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_order_status_event UNIQUE (order_id, status)
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON public.order_status_history(created_at ASC);

-- 2. Enhance orders table with cancellation & tracking metadata
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_estimate TEXT,
  ADD COLUMN IF NOT EXISTS current_tracking_step INTEGER DEFAULT 1;

-- 3. Enhance reviews table to support verified order connection
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_order ON public.reviews(product_id, order_id);

-- 4. Optimized Indexes on Orders and Order Items
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 5. RPC: get_customer_orders
-- Retrieves paginated orders for the authenticated customer with snapshot data and status filtering
CREATE OR REPLACE FUNCTION public.get_customer_orders(
  p_status TEXT DEFAULT 'all',
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_offset INTEGER;
  v_result JSONB;
  v_total_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  v_offset := (GREATEST(1, p_page) - 1) * p_limit;

  -- Count total matching orders
  SELECT COUNT(*) INTO v_total_count
  FROM public.orders o
  WHERE (o.customer_id = v_user_id OR o.user_id = v_user_id)
    AND (
      p_status = 'all'
      OR (p_status = 'processing' AND o.order_status IN ('pending', 'confirmed', 'processing', 'packed'))
      OR (p_status = 'shipped' AND o.order_status IN ('shipped', 'out_for_delivery'))
      OR (p_status = 'delivered' AND o.order_status IN ('delivered', 'completed'))
      OR (p_status = 'cancelled' AND o.order_status IN ('cancelled', 'refunded'))
      OR o.order_status = p_status
    );

  -- Retrieve aggregated order records
  SELECT jsonb_build_object(
    'success', true,
    'total', v_total_count,
    'page', p_page,
    'limit', p_limit,
    'orders', COALESCE(jsonb_agg(sub.order_obj), '[]'::jsonb)
  ) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'customer_id', COALESCE(o.customer_id, o.user_id),
      'created_at', o.created_at,
      'order_status', o.order_status,
      'status', o.order_status,
      'payment_status', o.payment_status,
      'payment_method', o.payment_method,
      'subtotal', o.subtotal,
      'delivery_fee', o.delivery_fee,
      'discount_amount', COALESCE(o.product_discount, 0) + COALESCE(o.coupon_discount, 0),
      'coupon_discount', o.coupon_discount,
      'total_amount', o.total_amount,
      'delivery_estimate', o.delivery_estimate,
      'current_tracking_step', o.current_tracking_step,
      'cancellation_reason', o.cancellation_reason,
      'cancelled_at', o.cancelled_at,
      'order_items', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', COALESCE(oi.product_name_snapshot, oi.product_name, p.name),
            'title', COALESCE(oi.product_name_snapshot, oi.product_name, p.name),
            'product_image', COALESCE(oi.product_image_snapshot, p.image_url),
            'image_url', COALESCE(oi.product_image_snapshot, p.image_url),
            'artisan_name', COALESCE(ap.name, p.artisan_name, 'Master Artisan'),
            'quantity', oi.quantity,
            'unit_price', COALESCE(oi.unit_price, oi.price),
            'price', COALESCE(oi.unit_price, oi.price),
            'total_price', COALESCE(oi.total_price, oi.price * oi.quantity),
            'product', jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'title', p.name,
              'category_name', p.category_name,
              'image_url', p.image_url
            )
          )
        ), '[]'::jsonb)
        FROM public.order_items oi
        LEFT JOIN public.products p ON p.id = oi.product_id
        LEFT JOIN public.artisan_profiles ap ON ap.id = COALESCE(oi.artisan_id, p.artisan_id)
        WHERE oi.order_id = o.id
      ),
      'shipping_address', (
        SELECT jsonb_build_object(
          'id', a.id,
          'full_name', a.full_name,
          'phone', a.phone,
          'address_line_1', a.address_line_1,
          'address_line_2', a.address_line_2,
          'city', a.city,
          'state', a.state,
          'pincode', a.pincode,
          'address_type', a.address_type
        )
        FROM public.addresses a
        WHERE a.id = o.shipping_address_id OR a.user_id = COALESCE(o.customer_id, o.user_id)
        ORDER BY (a.id = o.shipping_address_id) DESC, a.is_default DESC
        LIMIT 1
      )
    ) AS order_obj
    FROM public.orders o
    WHERE (o.customer_id = v_user_id OR o.user_id = v_user_id)
      AND (
        p_status = 'all'
        OR (p_status = 'processing' AND o.order_status IN ('pending', 'confirmed', 'processing', 'packed'))
        OR (p_status = 'shipped' AND o.order_status IN ('shipped', 'out_for_delivery'))
        OR (p_status = 'delivered' AND o.order_status IN ('delivered', 'completed'))
        OR (p_status = 'cancelled' AND o.order_status IN ('cancelled', 'refunded'))
        OR o.order_status = p_status
      )
    ORDER BY o.created_at DESC
    LIMIT p_limit OFFSET v_offset
  ) sub;

  RETURN v_result;
END;
$$;

-- 6. RPC: get_order_details
-- Retrieve single order details strictly verifying ownership
CREATE OR REPLACE FUNCTION public.get_order_details(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
  v_items JSONB;
  v_address JSONB;
  v_tracking JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND (customer_id = v_user_id OR user_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or unauthorized');
  END IF;

  -- Items
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'product_name', COALESCE(oi.product_name_snapshot, oi.product_name, p.name),
      'title', COALESCE(oi.product_name_snapshot, oi.product_name, p.name),
      'product_image', COALESCE(oi.product_image_snapshot, p.image_url),
      'image_url', COALESCE(oi.product_image_snapshot, p.image_url),
      'artisan_name', COALESCE(ap.name, p.artisan_name, 'Master Artisan'),
      'quantity', oi.quantity,
      'unit_price', COALESCE(oi.unit_price, oi.price),
      'price', COALESCE(oi.unit_price, oi.price),
      'total_price', COALESCE(oi.total_price, oi.price * oi.quantity),
      'product', jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'title', p.name,
        'category_name', p.category_name,
        'image_url', p.image_url
      )
    )
  ), '[]'::jsonb) INTO v_items
  FROM public.order_items oi
  LEFT JOIN public.products p ON p.id = oi.product_id
  LEFT JOIN public.artisan_profiles ap ON ap.id = COALESCE(oi.artisan_id, p.artisan_id)
  WHERE oi.order_id = p_order_id;

  -- Address
  SELECT jsonb_build_object(
    'id', a.id,
    'full_name', a.full_name,
    'phone', a.phone,
    'address_line_1', a.address_line_1,
    'address_line_2', a.address_line_2,
    'city', a.city,
    'state', a.state,
    'pincode', a.pincode,
    'address_type', a.address_type
  ) INTO v_address
  FROM public.addresses a
  WHERE a.id = v_order.shipping_address_id OR a.user_id = v_user_id
  ORDER BY (a.id = v_order.shipping_address_id) DESC, a.is_default DESC
  LIMIT 1;

  -- Tracking Events
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', h.id,
      'status', h.status,
      'description', h.description,
      'location', h.location,
      'created_at', h.created_at
    ) ORDER BY h.created_at ASC
  ), '[]'::jsonb) INTO v_tracking
  FROM public.order_status_history h
  WHERE h.order_id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order', jsonb_build_object(
      'id', v_order.id,
      'order_number', v_order.order_number,
      'customer_id', COALESCE(v_order.customer_id, v_order.user_id),
      'created_at', v_order.created_at,
      'order_status', v_order.order_status,
      'status', v_order.order_status,
      'payment_status', v_order.payment_status,
      'payment_method', v_order.payment_method,
      'delivery_option_id', v_order.delivery_option_id,
      'subtotal', v_order.subtotal,
      'delivery_fee', v_order.delivery_fee,
      'product_discount', v_order.product_discount,
      'coupon_discount', v_order.coupon_discount,
      'total_amount', v_order.total_amount,
      'delivery_estimate', v_order.delivery_estimate,
      'current_tracking_step', v_order.current_tracking_step,
      'cancellation_reason', v_order.cancellation_reason,
      'cancelled_at', v_order.cancelled_at,
      'order_items', v_items,
      'shipping_address', v_address,
      'tracking_history', v_tracking
    )
  );
END;
$$;

-- 7. RPC: get_order_tracking
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
  v_history JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND (customer_id = v_user_id OR user_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or unauthorized');
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'status', h.status,
      'description', h.description,
      'location', h.location,
      'created_at', h.created_at
    ) ORDER BY h.created_at ASC
  ), '[]'::jsonb) INTO v_history
  FROM public.order_status_history h
  WHERE h.order_id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.order_status,
    'current_step', v_order.current_tracking_step,
    'delivery_estimate', v_order.delivery_estimate,
    'tracking_history', v_history
  );
END;
$$;

-- 8. RPC: get_customer_order_counts
-- Lightweight status aggregation without full data load
CREATE OR REPLACE FUNCTION public.get_customer_order_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_total INTEGER := 0;
  v_processing INTEGER := 0;
  v_shipped INTEGER := 0;
  v_delivered INTEGER := 0;
  v_cancelled INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE order_status IN ('pending', 'confirmed', 'processing', 'packed')),
    COUNT(*) FILTER (WHERE order_status IN ('shipped', 'out_for_delivery')),
    COUNT(*) FILTER (WHERE order_status IN ('delivered', 'completed')),
    COUNT(*) FILTER (WHERE order_status IN ('cancelled', 'refunded'))
  INTO v_total, v_processing, v_shipped, v_delivered, v_cancelled
  FROM public.orders
  WHERE customer_id = v_user_id OR user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'all', v_total,
    'processing', v_processing,
    'shipped', v_shipped,
    'delivered', v_delivered,
    'cancelled', v_cancelled
  );
END;
$$;

-- 9. RPC: request_order_cancellation
-- Validates eligibility, restores inventory exactly once, logs status history
CREATE OR REPLACE FUNCTION public.request_order_cancellation(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Customer requested cancellation'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
  v_item RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND (customer_id = v_user_id OR user_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or unauthorized');
  END IF;

  IF v_order.order_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order is already cancelled');
  END IF;

  IF v_order.order_status IN ('delivered', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Delivered orders cannot be cancelled. Please request a return instead.');
  END IF;

  IF v_order.order_status IN ('shipped', 'out_for_delivery') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order has already shipped and cannot be cancelled directly.');
  END IF;

  -- 1. Restore product inventory
  FOR v_item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.products
    SET stock = stock + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  -- 2. Update order status
  UPDATE public.orders
  SET
    order_status = 'cancelled',
    cancellation_reason = p_reason,
    cancelled_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  -- 3. Record tracking event
  INSERT INTO public.order_status_history (order_id, status, description, updated_by)
  VALUES (
    p_order_id,
    'cancelled',
    'Order cancelled: ' || COALESCE(p_reason, 'Customer request'),
    v_user_id
  )
  ON CONFLICT (order_id, status) DO UPDATE SET
    description = EXCLUDED.description,
    created_at = timezone('utc'::text, now());

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order cancelled successfully and inventory restored',
    'order_id', p_order_id,
    'order_status', 'cancelled'
  );
END;
$$;

-- 10. RPC: get_eligible_review_products
-- Returns products from delivered orders that customer has not yet reviewed
CREATE OR REPLACE FUNCTION public.get_eligible_review_products(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
  v_products JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND (customer_id = v_user_id OR user_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_order.order_status NOT IN ('delivered', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only delivered orders are eligible for product reviews', 'eligible_products', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'product_id', oi.product_id,
      'product_name', COALESCE(oi.product_name_snapshot, oi.product_name, p.name),
      'image_url', COALESCE(oi.product_image_snapshot, p.image_url),
      'artisan_name', COALESCE(ap.name, p.artisan_name, 'Master Artisan'),
      'is_reviewed', EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.user_id = v_user_id AND r.product_id = oi.product_id
      )
    )
  ), '[]'::jsonb) INTO v_products
  FROM public.order_items oi
  LEFT JOIN public.products p ON p.id = oi.product_id
  LEFT JOIN public.artisan_profiles ap ON ap.id = COALESCE(oi.artisan_id, p.artisan_id)
  WHERE oi.order_id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'eligible_products', v_products
  );
END;
$$;

-- 11. RPC: submit_product_review_atomic
-- Validates verified purchase, delivered state, rating range, and calculates new average rating
CREATE OR REPLACE FUNCTION public.submit_product_review_atomic(
  p_product_id UUID,
  p_order_id UUID,
  p_rating NUMERIC,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
  v_review_id UUID;
  v_avg_rating NUMERIC(2, 1);
  v_review_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rating must be an integer between 1 and 5');
  END IF;

  -- Verify user purchased this product in the specified order and order is delivered
  SELECT o.* INTO v_order
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.id = p_order_id
    AND (o.customer_id = v_user_id OR o.user_id = v_user_id)
    AND oi.product_id = p_product_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verified purchase required to submit review');
  END IF;

  IF v_order.order_status NOT IN ('delivered', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reviews are only accepted after order is delivered');
  END IF;

  -- Upsert review
  INSERT INTO public.reviews (
    user_id,
    product_id,
    order_id,
    rating,
    comment,
    is_verified_purchase,
    is_published,
    updated_at
  ) VALUES (
    v_user_id,
    p_product_id,
    p_order_id,
    ROUND(p_rating, 1),
    TRIM(p_comment),
    true,
    true,
    timezone('utc'::text, now())
  )
  ON CONFLICT (user_id, product_id) DO UPDATE SET
    order_id = EXCLUDED.order_id,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    updated_at = timezone('utc'::text, now())
  RETURNING id INTO v_review_id;

  -- Recalculate product rating statistics
  SELECT
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM public.reviews
  WHERE product_id = p_product_id AND is_published = true;

  UPDATE public.products
  SET
    rating = v_avg_rating,
    reviews_count = v_review_count
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Review submitted successfully',
    'review_id', v_review_id,
    'product_id', p_product_id,
    'new_rating', v_avg_rating,
    'total_reviews', v_review_count
  );
END;
$$;

-- 12. RPC: get_order_review_status
CREATE OR REPLACE FUNCTION public.get_order_review_status(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_total_items INTEGER := 0;
  v_reviewed_items INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT COUNT(DISTINCT oi.product_id)
  INTO v_total_items
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.id = p_order_id AND (o.customer_id = v_user_id OR o.user_id = v_user_id);

  SELECT COUNT(DISTINCT r.product_id)
  INTO v_reviewed_items
  FROM public.reviews r
  JOIN public.order_items oi ON oi.product_id = r.product_id
  WHERE oi.order_id = p_order_id AND r.user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'total_products', v_total_items,
    'reviewed_products', v_reviewed_items,
    'all_reviewed', (v_total_items > 0 AND v_total_items = v_reviewed_items)
  );
END;
$$;

-- 13. Enable RLS on order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Customers can view tracking history only for their own orders
DROP POLICY IF EXISTS "order_status_history_select_own" ON public.order_status_history;
CREATE POLICY "order_status_history_select_own" ON public.order_status_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
      AND (o.customer_id = auth.uid() OR o.user_id = auth.uid())
  )
);

-- Artisans can view tracking history for orders containing their products
DROP POLICY IF EXISTS "order_status_history_select_artisan" ON public.order_status_history;
CREATE POLICY "order_status_history_select_artisan" ON public.order_status_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = order_status_history.order_id
      AND (p.artisan_id = auth.uid() OR oi.artisan_id = auth.uid())
  )
);

-- Reviews RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_read_published" ON public.reviews;
CREATE POLICY "reviews_read_published" ON public.reviews
FOR SELECT USING (is_published = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.reviews;
CREATE POLICY "reviews_insert_authenticated" ON public.reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

