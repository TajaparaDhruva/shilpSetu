-- ==============================================================================
-- ShilpSetu Database Migration: artisan_earnings_backend.sql
-- ==============================================================================
-- Production-Ready Artisan Earnings Management System
--
-- Features:
-- 1. Financial Schema Extensions:
--    - Refunds table (public.refunds) linked to orders, order_items, and payments
--    - Commission settings (5% standard platform fee, transparently tracked)
-- 2. Performance Indexes on orders, order_items, payments, payouts, refunds
-- 3. Row Level Security (RLS) on payments, payouts, and refunds:
--    - Artisans can only SELECT records where artisan_id = auth.uid()
--    - Prohibits manual mutation of payments and payouts by users/artisans
-- 4. Secure RPC: get_artisan_earnings_summary(p_period)
--    - Calculates for authenticated artisan (auth.uid()):
--      * Gross Sales (only paid/authorized orders, excluding cancelled/refunded)
--      * Platform Commission (5%)
--      * Refunds (actual refund records or cancelled order amounts)
--      * Net Earnings (Gross Sales - Commission - Refunds)
--      * Previous Period Net Earnings & Growth Percentage
--      * Total Eligible Orders
--      * Products Sold
--      * Average Order Value
--      * Average Rating & Total Reviews
-- 5. Secure RPC: get_artisan_monthly_earnings(p_period)
--    - Aggregates actual monthly earnings grouped by month
--    - Returns zeros only for actual months without artificial values
-- 6. Secure RPC: get_artisan_transactions(p_limit, p_offset, p_start_date, p_end_date)
--    - Returns itemized transactions with order number, amount, payment & refund status
-- ==============================================================================

-- 1. Ensure refunds table exists for tracking refunds safely
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  artisan_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  reason text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  gateway_refund_id text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_artisan_created ON public.order_items(artisan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_status ON public.payments(order_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_artisan_status ON public.payouts(artisan_id, status);
CREATE INDEX IF NOT EXISTS idx_refunds_artisan_created ON public.refunds(artisan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);

-- 3. Row Level Security (RLS) on refunds, payouts, payments
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3a. Refunds RLS
DROP POLICY IF EXISTS "Artisans can view own refunds" ON public.refunds;
CREATE POLICY "Artisans can view own refunds"
  ON public.refunds FOR SELECT
  TO authenticated
  USING (artisan_id = auth.uid());

DROP POLICY IF EXISTS "Customers can view own refunds" ON public.refunds;
CREATE POLICY "Customers can view own refunds"
  ON public.refunds FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- 3b. Payments RLS
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Artisans can view payments of orders containing their products" ON public.payments;
CREATE POLICY "Artisans can view payments of orders containing their products"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = public.payments.order_id AND (oi.artisan_id = auth.uid() OR p.artisan_id = auth.uid())
    )
  );

-- 3c. Payouts RLS
DROP POLICY IF EXISTS "Artisans can view own payouts" ON public.payouts;
CREATE POLICY "Artisans can view own payouts"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (artisan_id = auth.uid());

-- 4. Secure RPC: get_artisan_earnings_summary
CREATE OR REPLACE FUNCTION public.get_artisan_earnings_summary(
  p_period text DEFAULT 'this_month' -- 'this_month', 'last_month', 'last_3_months', 'this_year'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_now timestamptz := timezone('utc'::text, now());
  v_start_date timestamptz;
  v_end_date timestamptz := v_now;
  v_prior_start_date timestamptz;
  v_prior_end_date timestamptz;

  v_commission_rate numeric(4, 2) := 0.05; -- Standard 5% platform commission
  v_gross_sales numeric(12, 2) := 0;
  v_commission numeric(12, 2) := 0;
  v_refunds numeric(12, 2) := 0;
  v_net_earnings numeric(12, 2) := 0;

  v_prior_gross numeric(12, 2) := 0;
  v_prior_net numeric(12, 2) := 0;
  v_growth_pct numeric(5, 1) := 0.0;

  v_total_orders integer := 0;
  v_products_sold integer := 0;
  v_avg_order_value numeric(10, 2) := 0;
  v_avg_rating numeric(2, 1) := 0.0;
  v_total_reviews integer := 0;

  v_chart_points jsonb := '[]'::jsonb;
  v_recent_transactions jsonb := '[]'::jsonb;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- 1. Date range calculation
  IF p_period = 'this_month' THEN
    v_start_date := date_trunc('month', v_now);
    v_prior_start_date := date_trunc('month', v_now - interval '1 month');
    v_prior_end_date := date_trunc('month', v_now) - interval '1 second';
  ELSIF p_period = 'last_month' THEN
    v_start_date := date_trunc('month', v_now - interval '1 month');
    v_end_date := date_trunc('month', v_now) - interval '1 second';
    v_prior_start_date := date_trunc('month', v_now - interval '2 months');
    v_prior_end_date := date_trunc('month', v_now - interval '1 month') - interval '1 second';
  ELSIF p_period = 'last_3_months' THEN
    v_start_date := date_trunc('month', v_now - interval '2 months');
    v_prior_start_date := date_trunc('month', v_now - interval '5 months');
    v_prior_end_date := date_trunc('month', v_now - interval '2 months') - interval '1 second';
  ELSIF p_period = 'this_year' THEN
    v_start_date := date_trunc('year', v_now);
    v_prior_start_date := date_trunc('year', v_now - interval '1 year');
    v_prior_end_date := date_trunc('year', v_now) - interval '1 second';
  ELSE
    v_start_date := date_trunc('month', v_now);
    v_prior_start_date := date_trunc('month', v_now - interval '1 month');
    v_prior_end_date := date_trunc('month', v_now) - interval '1 second';
  END IF;

  -- 2. Current period: Gross Sales, Orders, and Units Sold
  -- Include only paid/confirmed orders; exclude cancelled and refunded
  SELECT
    COALESCE(SUM(COALESCE(oi.total_price, oi.price * oi.quantity, 0)), 0),
    COUNT(DISTINCT oi.order_id),
    COALESCE(SUM(oi.quantity), 0)
  INTO
    v_gross_sales,
    v_total_orders,
    v_products_sold
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
    AND o.created_at >= v_start_date
    AND o.created_at <= v_end_date
    AND o.order_status NOT IN ('cancelled', 'refunded')
    AND (
      o.payment_status IN ('paid', 'authorized')
      OR o.order_status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'completed')
      OR LOWER(o.payment_method) = 'cod'
    );

  -- Calculate 5% marketplace commission
  v_commission := ROUND(v_gross_sales * v_commission_rate, 2);

  -- Query actual refunds in period
  SELECT COALESCE(SUM(amount), 0)
  INTO v_refunds
  FROM public.refunds
  WHERE artisan_id = v_artisan_id
    AND created_at >= v_start_date
    AND created_at <= v_end_date
    AND status = 'completed';

  -- Net Earnings = Gross Sales - Platform Commission - Refunds
  v_net_earnings := GREATEST(0, v_gross_sales - v_commission - v_refunds);

  -- Average order value
  IF v_total_orders > 0 THEN
    v_avg_order_value := ROUND(v_gross_sales / v_total_orders, 2);
  END IF;

  -- 3. Prior Period Calculation for growth %
  SELECT
    COALESCE(SUM(COALESCE(oi.total_price, oi.price * oi.quantity, 0)), 0)
  INTO v_prior_gross
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
    AND o.created_at >= v_prior_start_date
    AND o.created_at <= v_prior_end_date
    AND o.order_status NOT IN ('cancelled', 'refunded')
    AND (
      o.payment_status IN ('paid', 'authorized')
      OR o.order_status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'completed')
      OR LOWER(o.payment_method) = 'cod'
    );

  v_prior_net := GREATEST(0, ROUND(v_prior_gross * (1.0 - v_commission_rate), 2));

  IF v_prior_net > 0 THEN
    v_growth_pct := ROUND(((v_net_earnings - v_prior_net) / v_prior_net) * 100.0, 1);
  ELSIF v_net_earnings > 0 THEN
    v_growth_pct := 100.0;
  ELSE
    v_growth_pct := 0.0;
  END IF;

  -- 4. Average Rating & Reviews
  SELECT
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0),
    COUNT(r.id)
  INTO v_avg_rating, v_total_reviews
  FROM public.reviews r
  JOIN public.products p ON p.id = r.product_id
  WHERE p.artisan_id = v_artisan_id
    AND r.is_published = true;

  -- 5. Monthly Chart aggregation
  WITH monthly_series AS (
    SELECT
      to_char(date_trunc('month', o.created_at), 'Mon') AS label,
      date_trunc('month', o.created_at) AS month_date,
      ROUND(COALESCE(SUM(COALESCE(oi.total_price, oi.price * oi.quantity, 0)), 0) * (1.0 - v_commission_rate), 2) AS earnings
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
      AND o.created_at >= v_start_date
      AND o.created_at <= v_end_date
      AND o.order_status NOT IN ('cancelled', 'refunded')
      AND (
        o.payment_status IN ('paid', 'authorized')
        OR o.order_status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'completed')
        OR LOWER(o.payment_method) = 'cod'
      )
    GROUP BY date_trunc('month', o.created_at)
    ORDER BY date_trunc('month', o.created_at) ASC
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'label', ms.label,
      'month_date', ms.month_date,
      'earnings', ms.earnings
    )
  ), '[]'::jsonb) INTO v_chart_points
  FROM monthly_series ms;

  -- 6. Recent Transactions (latest 5)
  WITH transactions AS (
    SELECT
      o.id AS order_id,
      o.order_number,
      o.created_at,
      COALESCE(o.order_status, 'completed') AS status,
      COALESCE(o.payment_status, 'paid') AS payment_status,
      COALESCE(oi.product_name_snapshot, p.name, 'Artisan Craft') AS product_name,
      ROUND(COALESCE(oi.total_price, oi.price * oi.quantity, 0) * (1.0 - v_commission_rate), 2) AS amount
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
    ORDER BY o.created_at DESC
    LIMIT 5
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_recent_transactions
  FROM transactions t;

  RETURN jsonb_build_object(
    'success', true,
    'period', p_period,
    'total_earnings', v_net_earnings,
    'gross_sales', v_gross_sales,
    'commission', v_commission,
    'refunds', v_refunds,
    'prior_earnings', v_prior_net,
    'growth_percentage', v_growth_pct,
    'is_growth', (v_net_earnings >= v_prior_net),
    'total_orders', v_total_orders,
    'products_sold', v_products_sold,
    'average_rating', v_avg_rating,
    'total_reviews', v_total_reviews,
    'average_order_value', v_avg_order_value,
    'chart_points', v_chart_points,
    'recent_transactions', v_recent_transactions
  );
END;
$$;

-- 5. RPC: get_artisan_monthly_earnings(p_period)
CREATE OR REPLACE FUNCTION public.get_artisan_monthly_earnings(
  p_period text DEFAULT 'last_3_months'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_now timestamptz := timezone('utc'::text, now());
  v_start_date timestamptz;
  v_end_date timestamptz := v_now;
  v_commission_rate numeric(4, 2) := 0.05;
  v_series jsonb := '[]'::jsonb;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_period = 'this_month' THEN
    v_start_date := date_trunc('month', v_now);
  ELSIF p_period = 'last_month' THEN
    v_start_date := date_trunc('month', v_now - interval '1 month');
    v_end_date := date_trunc('month', v_now) - interval '1 second';
  ELSIF p_period = 'last_3_months' THEN
    v_start_date := date_trunc('month', v_now - interval '2 months');
  ELSIF p_period = 'this_year' THEN
    v_start_date := date_trunc('year', v_now);
  ELSE
    v_start_date := date_trunc('month', v_now - interval '2 months');
  END IF;

  WITH monthly_series AS (
    SELECT
      to_char(date_trunc('month', o.created_at), 'Mon') AS label,
      date_trunc('month', o.created_at) AS month_date,
      ROUND(COALESCE(SUM(COALESCE(oi.total_price, oi.price * oi.quantity, 0)), 0) * (1.0 - v_commission_rate), 2) AS earnings
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
      AND o.created_at >= v_start_date
      AND o.created_at <= v_end_date
      AND o.order_status NOT IN ('cancelled', 'refunded')
      AND (
        o.payment_status IN ('paid', 'authorized')
        OR o.order_status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'completed')
        OR LOWER(o.payment_method) = 'cod'
      )
    GROUP BY date_trunc('month', o.created_at)
    ORDER BY date_trunc('month', o.created_at) ASC
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'label', ms.label,
      'month_date', ms.month_date,
      'earnings', ms.earnings
    )
  ), '[]'::jsonb) INTO v_series
  FROM monthly_series ms;

  RETURN jsonb_build_object(
    'success', true,
    'period', p_period,
    'series', v_series
  );
END;
$$;

-- 6. RPC: get_artisan_transactions
CREATE OR REPLACE FUNCTION public.get_artisan_transactions(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_artisan_id uuid;
  v_commission_rate numeric(4, 2) := 0.05;
  v_transactions jsonb := '[]'::jsonb;
  v_total integer := 0;
BEGIN
  v_artisan_id := auth.uid();
  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT count(*)::integer INTO v_total
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date);

  WITH tx_page AS (
    SELECT
      oi.id AS transaction_id,
      o.id AS order_id,
      o.order_number,
      o.created_at,
      COALESCE(o.order_status, 'completed') AS status,
      COALESCE(o.payment_status, 'paid') AS payment_status,
      COALESCE(oi.product_name_snapshot, p.name, 'Artisan Craft') AS product_name,
      ROUND(COALESCE(oi.total_price, oi.price * oi.quantity, 0) * (1.0 - v_commission_rate), 2) AS amount,
      EXISTS (
        SELECT 1 FROM public.refunds ref
        WHERE ref.order_item_id = oi.id OR (ref.order_id = o.id AND ref.artisan_id = v_artisan_id)
      ) AS is_refunded
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE (oi.artisan_id = v_artisan_id OR p.artisan_id = v_artisan_id)
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    ORDER BY o.created_at DESC
    LIMIT coalesce(p_limit, 20)
    OFFSET coalesce(p_offset, 0)
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(tp)), '[]'::jsonb) INTO v_transactions
  FROM tx_page tp;

  RETURN jsonb_build_object(
    'success', true,
    'total', v_total,
    'transactions', v_transactions
  );
END;
$$;
