-- ==============================================================================
-- ShilpSetu Database Migration: Artisan Dashboard Backend System
-- File: artisan_dashboard_backend.sql (20261113180000_artisan_dashboard_backend.sql)
--
-- Features:
--   1. notifications table (user_id, title, message, type, order_id, is_read, created_at)
--   2. payouts table (artisan_id, amount, status, reference_number, processed_at)
--   3. Optimized indexes on products, order_items, reviews, orders, notifications
--   4. Secure RPC Functions:
--      - get_artisan_dashboard_profile_rpc()
--      - get_artisan_dashboard_stats_rpc()
--      - get_artisan_recent_orders_rpc(p_limit)
--      - get_artisan_order_counts_rpc()
--      - get_artisan_notifications_rpc(p_limit)
--      - mark_notification_read_rpc(p_notification_id)
--   5. Row Level Security (RLS) policies for notifications & payouts
-- ==============================================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'order' CHECK (notification_type IN ('order', 'payout', 'review', 'system', 'inventory')),
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- 2. Create payouts table (financial audit & tracking)
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reference_number TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payouts_artisan ON public.payouts(artisan_id);

-- 3. Optimized B-Tree Indexes for Dashboard Aggregations
CREATE INDEX IF NOT EXISTS idx_products_artisan_active ON public.products(artisan_id, is_active);
CREATE INDEX IF NOT EXISTS idx_order_items_artisan_order ON public.order_items(artisan_id, order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_pub ON public.reviews(product_id, is_published);

-- 4. RPC: get_artisan_dashboard_profile_rpc
-- Authenticated artisan profile retrieval based on auth.uid() identity
CREATE OR REPLACE FUNCTION public.get_artisan_dashboard_profile_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_artisan RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  SELECT * INTO v_artisan FROM public.artisan_profiles WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'artisan_id', v_user_id,
    'full_name', COALESCE(v_profile.full_name, v_profile.name, 'Artisan'),
    'avatar_url', v_profile.avatar_url,
    'craft_specialization', COALESCE(v_artisan.craft_specialization, v_artisan.craft_type, 'Master Artisan'),
    'is_verified', COALESCE(v_artisan.is_verified, false),
    'account_status', 'active',
    'is_online', true
  );
END;
$$;

-- 5. RPC: get_artisan_dashboard_stats_rpc
-- Fast server-side calculation for Total Products, Distinct Orders, Eligible Net Earnings, Rating & Reviews
CREATE OR REPLACE FUNCTION public.get_artisan_dashboard_stats_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_total_products INTEGER := 0;
  v_inactive_products INTEGER := 0;
  v_total_orders INTEGER := 0;
  v_gross_sales NUMERIC(10, 2) := 0;
  v_net_earnings NUMERIC(10, 2) := 0;
  v_paid_payouts NUMERIC(10, 2) := 0;
  v_pending_payout NUMERIC(10, 2) := 0;
  v_average_rating NUMERIC(2, 1) := 0.0;
  v_total_reviews INTEGER := 0;
  v_commission_rate NUMERIC(4, 2) := 0.05; -- 5% standard marketplace platform commission
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- 1. Product Counts
  SELECT
    COUNT(*) FILTER (WHERE is_active = true),
    COUNT(*) FILTER (WHERE is_active = false)
  INTO v_total_products, v_inactive_products
  FROM public.products
  WHERE artisan_id = v_user_id;

  -- 2. Distinct Orders and Earnings
  -- Exclude cancelled and refunded orders; require paid or authorized/confirmed orders
  SELECT
    COUNT(DISTINCT oi.order_id),
    COALESCE(SUM(COALESCE(oi.total_price, oi.price * oi.quantity)), 0)
  INTO v_total_orders, v_gross_sales
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE (oi.artisan_id = v_user_id OR EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = oi.product_id AND p.artisan_id = v_user_id
  ))
  AND o.order_status NOT IN ('cancelled', 'refunded')
  AND (o.payment_status IN ('paid', 'authorized') OR o.order_status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'completed'));

  -- Net earnings = Gross sales minus platform commission (5%)
  v_net_earnings := ROUND(v_gross_sales * (1.0 - v_commission_rate), 2);

  -- Payouts tracking
  SELECT COALESCE(SUM(amount), 0) INTO v_paid_payouts
  FROM public.payouts
  WHERE artisan_id = v_user_id AND status = 'completed';

  v_pending_payout := GREATEST(0, v_net_earnings - v_paid_payouts);

  -- 3. Average Rating and Total Published Reviews across artisan's products
  SELECT
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0),
    COUNT(r.id)
  INTO v_average_rating, v_total_reviews
  FROM public.reviews r
  JOIN public.products p ON p.id = r.product_id
  WHERE p.artisan_id = v_user_id AND r.is_published = true;

  RETURN jsonb_build_object(
    'success', true,
    'total_products', v_total_products,
    'inactive_products', v_inactive_products,
    'total_orders', v_total_orders,
    'gross_sales', v_gross_sales,
    'net_earnings', v_net_earnings,
    'paid_payouts', v_paid_payouts,
    'pending_payout', v_pending_payout,
    'average_rating', v_average_rating,
    'total_reviews', v_total_reviews
  );
END;
$$;

-- 6. RPC: get_artisan_recent_orders_rpc
-- Returns latest orders containing authenticated artisan's items without exposing other artisans' items
CREATE OR REPLACE FUNCTION public.get_artisan_recent_orders_rpc(p_limit INTEGER DEFAULT 3)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_orders JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT COALESCE(jsonb_agg(sub.order_item_obj), '[]'::jsonb) INTO v_orders
  FROM (
    SELECT jsonb_build_object(
      'id', o.id,
      'order_id', o.id,
      'order_number', o.order_number,
      'created_at', o.created_at,
      'order_status', o.order_status,
      'status', o.order_status,
      'product_id', oi.product_id,
      'product_name', COALESCE(oi.product_name_snapshot, oi.product_name, p.name),
      'product_image', COALESCE(oi.product_image_snapshot, p.image_url),
      'quantity', oi.quantity,
      'price', COALESCE(oi.unit_price, oi.price),
      'total_price', COALESCE(oi.total_price, oi.price * oi.quantity),
      'image_key', COALESCE(p.category, 'pottery')
    ) AS order_item_obj
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE (oi.artisan_id = v_user_id OR p.artisan_id = v_user_id)
    ORDER BY o.created_at DESC
    LIMIT p_limit
  ) sub;

  RETURN jsonb_build_object('success', true, 'recent_orders', v_orders);
END;
$$;

-- 7. RPC: get_artisan_order_counts_rpc
-- Counts distinct artisan orders segmented by workflow status
CREATE OR REPLACE FUNCTION public.get_artisan_order_counts_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new INTEGER := 0;
  v_processing INTEGER := 0;
  v_packed INTEGER := 0;
  v_shipped INTEGER := 0;
  v_delivered INTEGER := 0;
  v_cancelled INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT
    COUNT(DISTINCT o.id) FILTER (WHERE o.order_status IN ('pending', 'confirmed')),
    COUNT(DISTINCT o.id) FILTER (WHERE o.order_status = 'processing'),
    COUNT(DISTINCT o.id) FILTER (WHERE o.order_status = 'packed'),
    COUNT(DISTINCT o.id) FILTER (WHERE o.order_status IN ('shipped', 'out_for_delivery')),
    COUNT(DISTINCT o.id) FILTER (WHERE o.order_status IN ('delivered', 'completed')),
    COUNT(DISTINCT o.id) FILTER (WHERE o.order_status IN ('cancelled', 'refunded'))
  INTO v_new, v_processing, v_packed, v_shipped, v_delivered, v_cancelled
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE oi.artisan_id = v_user_id OR p.artisan_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'new', v_new,
    'processing', v_processing,
    'packed', v_packed,
    'shipped', v_shipped,
    'delivered', v_delivered,
    'cancelled', v_cancelled
  );
END;
$$;

-- 8. RPC: get_artisan_notifications_rpc & mark_notification_read_rpc
CREATE OR REPLACE FUNCTION public.get_artisan_notifications_rpc(p_limit INTEGER DEFAULT 10)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_notifications JSONB;
  v_unread_count INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT COUNT(*) INTO v_unread_count
  FROM public.notifications
  WHERE user_id = v_user_id AND is_read = false;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', n.id,
      'title', n.title,
      'message', n.message,
      'notification_type', n.notification_type,
      'related_order_id', n.related_order_id,
      'is_read', n.is_read,
      'created_at', n.created_at
    ) ORDER BY n.created_at DESC
  ), '[]'::jsonb) INTO v_notifications
  FROM (
    SELECT * FROM public.notifications
    WHERE user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT p_limit
  ) n;

  RETURN jsonb_build_object(
    'success', true,
    'unread_count', v_unread_count,
    'notifications', v_notifications
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read_rpc(p_notification_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  UPDATE public.notifications
  SET is_read = true
  WHERE id = p_notification_id AND user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Notification marked as read');
END;
$$;

-- 9. Row Level Security Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payouts_select_own" ON public.payouts;
CREATE POLICY "payouts_select_own" ON public.payouts
FOR SELECT USING (artisan_id = auth.uid());

