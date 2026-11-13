-- ============================================================
-- Migration: 20261113150000_cart_checkout_schema.sql
-- Cart & Checkout schema: customer_addresses, coupons,
--   orders column additions, RLS policies, seed data, RPC
-- ============================================================

-- 1. customer_addresses table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add missing columns to orders table (already created in 20261113140000)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.customer_addresses(id),
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS delivery_option TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS item_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;

-- 4. Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for customer_addresses
DROP POLICY IF EXISTS "customers_select_own_addresses" ON public.customer_addresses;
CREATE POLICY "customers_select_own_addresses"
  ON public.customer_addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_insert_own_addresses" ON public.customer_addresses;
CREATE POLICY "customers_insert_own_addresses"
  ON public.customer_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_update_own_addresses" ON public.customer_addresses;
CREATE POLICY "customers_update_own_addresses"
  ON public.customer_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_delete_own_addresses" ON public.customer_addresses;
CREATE POLICY "customers_delete_own_addresses"
  ON public.customer_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS policy for coupons: authenticated users SELECT active coupons
DROP POLICY IF EXISTS "authenticated_select_active_coupons" ON public.coupons;
CREATE POLICY "authenticated_select_active_coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 7. Seed test coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, max_discount, is_active)
VALUES
  ('WELCOME10', 'percentage', 10, 200, 100, true),
  ('FLAT50', 'flat', 50, 500, 50, true)
ON CONFLICT (code) DO NOTHING;

-- 8. RPC: validate_coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code TEXT, p_cart_total NUMERIC)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_discount NUMERIC;
BEGIN
  SELECT * INTO v_coupon FROM coupons
  WHERE UPPER(code) = UPPER(p_code) AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired coupon');
  END IF;
  IF p_cart_total < v_coupon.min_order_value THEN
    RETURN json_build_object('valid', false, 'error', format('Minimum order ₹%s required', v_coupon.min_order_value));
  END IF;
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := LEAST(p_cart_total * v_coupon.discount_value / 100, COALESCE(v_coupon.max_discount, p_cart_total));
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  RETURN json_build_object('valid', true, 'discount_amount', v_discount, 'coupon_code', v_coupon.code, 'discount_type', v_coupon.discount_type);
END;
$$;

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, NUMERIC) TO authenticated, anon;
