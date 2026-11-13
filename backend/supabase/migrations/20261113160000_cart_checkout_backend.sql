-- ==============================================================================
-- ShilpSetu Database Migration: Complete Cart & Checkout Backend System
-- File: cart_checkout_backend.sql (20261113160000_cart_checkout_backend.sql)
--
-- Tables:
--   - addresses (aliased/extended customer_addresses)
--   - coupons (enhanced with usage limits, max discount, eligibility)
--   - delivery_options (configurable delivery options with PIN availability)
--   - orders (extended with full snapshot fields, transaction state, idempotency)
--   - order_items (snapshot unit_price, discount, total_price, product_name, image)
--   - payments (payment transactions, razorpay order/payment IDs, signature verification)
--
-- RPC Functions:
--   - calculate_checkout_total(cart_items, coupon_code, delivery_option_id)
--   - create_order_atomic(checkout_data, idempotency_key)
--   - cancel_order_and_restore_stock(order_id)
--   - get_cart_items_with_details(p_user_id)
-- ==============================================================================

-- 1. Ensure addresses table exists with exact specified fields
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  district TEXT,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL CHECK (pincode ~ '^[0-9]{6}$'),
  address_type TEXT DEFAULT 'Home' CHECK (address_type IN ('Home', 'Work', 'Other')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Backwards compatibility: If customer_addresses exists, sync or link
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_addresses') THEN
    INSERT INTO public.addresses (id, user_id, full_name, phone, address_line_1, address_line_2, city, state, pincode, is_default, created_at, updated_at)
    SELECT id, user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default, created_at, updated_at
    FROM public.customer_addresses
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_pincode ON public.addresses(pincode);

-- 2. Ensure delivery_options table exists
CREATE TABLE IF NOT EXISTS public.delivery_options (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  estimated_min_days INTEGER NOT NULL DEFAULT 3,
  estimated_max_days INTEGER NOT NULL DEFAULT 5,
  available_pincodes TEXT[], -- NULL means all PIN codes supported
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Seed initial delivery options
INSERT INTO public.delivery_options (id, name, delivery_fee, estimated_min_days, estimated_max_days, is_active)
VALUES
  ('standard', 'Standard Delivery', 49.00, 3, 5, true),
  ('express', 'Express Delivery', 99.00, 1, 2, true)
ON CONFLICT (id) DO UPDATE SET
  delivery_fee = EXCLUDED.delivery_fee,
  estimated_min_days = EXCLUDED.estimated_min_days,
  estimated_max_days = EXCLUDED.estimated_max_days,
  is_active = EXCLUDED.is_active;

-- 3. Enhance coupons table with full fields
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS minimum_order_amount NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maximum_discount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

-- Sync min_order_value to minimum_order_amount if column was added previously
UPDATE public.coupons SET minimum_order_amount = COALESCE(minimum_order_amount, min_order_value, 0);

-- Insert standard promo coupons
INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order_amount, maximum_discount, is_active, expiry_date, usage_limit, per_user_limit)
VALUES
  ('WELCOME10', 'percent', 10.00, 200.00, 100.00, true, '2028-12-31 23:59:59+00', 10000, 1),
  ('FLAT50', 'flat', 50.00, 200.00, 50.00, true, '2028-12-31 23:59:59+00', 10000, 1),
  ('SHILP200', 'flat', 200.00, 1000.00, 200.00, true, '2028-12-31 23:59:59+00', 5000, 1)
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  minimum_order_amount = EXCLUDED.minimum_order_amount,
  maximum_discount = EXCLUDED.maximum_discount,
  is_active = EXCLUDED.is_active;

-- 4. Enhance orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_discount NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_option_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Make user_id and customer_id interchangeable
UPDATE public.orders SET customer_id = user_id WHERE customer_id IS NULL AND user_id IS NOT NULL;
UPDATE public.orders SET user_id = customer_id WHERE user_id IS NULL AND customer_id IS NOT NULL;

-- 5. Enhance order_items table for price snapshots
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS artisan_id UUID,
  ADD COLUMN IF NOT EXISTS product_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS product_image_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2) DEFAULT 0;

-- 6. Payments Table for tracking transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  gateway_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON public.payments(razorpay_order_id);

-- 7. Secure RPC: calculate_checkout_total
-- Safe arithmetic calculation using DB prices without trusting client totals
CREATE OR REPLACE FUNCTION public.calculate_checkout_total(
  p_cart_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_delivery_option_id TEXT DEFAULT 'standard'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
  v_item_subtotal NUMERIC(10, 2) := 0;
  v_product_discounts NUMERIC(10, 2) := 0;
  v_coupon_discount NUMERIC(10, 2) := 0;
  v_delivery_fee NUMERIC(10, 2) := 49.00;
  v_final_payable NUMERIC(10, 2) := 0;
  v_delivery RECORD;
  v_coupon RECORD;
  v_quantity INTEGER;
  v_product_id UUID;
  v_invalid_items JSONB := '[]'::JSONB;
BEGIN
  -- 1. Validate each item against database
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_product_id := (v_item.value->>'product_id')::UUID;
    v_quantity := COALESCE((v_item.value->>'quantity')::INTEGER, 1);

    SELECT id, name, price, original_price, stock, is_active
    INTO v_product
    FROM public.products
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      v_invalid_items := v_invalid_items || jsonb_build_object('product_id', v_product_id, 'reason', 'Product not found');
    ELSIF NOT v_product.is_active THEN
      v_invalid_items := v_invalid_items || jsonb_build_object('product_id', v_product_id, 'reason', 'Product is inactive');
    ELSIF v_product.stock < v_quantity THEN
      v_invalid_items := v_invalid_items || jsonb_build_object('product_id', v_product_id, 'reason', 'Insufficient stock', 'available', v_product.stock);
    ELSE
      v_item_subtotal := v_item_subtotal + (v_product.price * v_quantity);
      IF v_product.original_price IS NOT NULL AND v_product.original_price > v_product.price THEN
        v_product_discounts := v_product_discounts + ((v_product.original_price - v_product.price) * v_quantity);
      END IF;
    END IF;
  END LOOP;

  IF jsonb_array_length(v_invalid_items) > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'invalid_items', v_invalid_items,
      'error', 'One or more items in your cart cannot be checked out'
    );
  END IF;

  -- 2. Delivery Fee
  SELECT * INTO v_delivery FROM public.delivery_options WHERE id = p_delivery_option_id AND is_active = true;
  IF FOUND THEN
    v_delivery_fee := v_delivery.delivery_fee;
  ELSE
    v_delivery_fee := 49.00;
  END IF;

  -- 3. Coupon Calculation
  IF p_coupon_code IS NOT NULL AND LENGTH(TRIM(p_coupon_code)) > 0 THEN
    SELECT * INTO v_coupon FROM public.coupons
    WHERE UPPER(code) = UPPER(TRIM(p_coupon_code)) AND is_active = true
      AND (expiry_date IS NULL OR expiry_date > timezone('utc'::text, now()));

    IF FOUND THEN
      IF v_item_subtotal >= COALESCE(v_coupon.minimum_order_amount, 0) THEN
        IF v_coupon.discount_type IN ('percent', 'percentage') THEN
          v_coupon_discount := (v_item_subtotal * v_coupon.discount_value) / 100.0;
          IF v_coupon.maximum_discount IS NOT NULL AND v_coupon_discount > v_coupon.maximum_discount THEN
            v_coupon_discount := v_coupon.maximum_discount;
          END IF;
        ELSE
          v_coupon_discount := LEAST(v_coupon.discount_value, v_item_subtotal);
        END IF;
      END IF;
    END IF;
  END IF;

  v_final_payable := GREATEST(0, (v_item_subtotal - v_coupon_discount) + v_delivery_fee);

  RETURN jsonb_build_object(
    'valid', true,
    'item_subtotal', v_item_subtotal,
    'product_discounts', v_product_discounts,
    'coupon_discount', v_coupon_discount,
    'delivery_fee', v_delivery_fee,
    'final_payable_amount', v_final_payable
  );
END;
$$;

-- 8. Atomic Order Creation RPC: create_order_atomic
-- Creates orders, order_items, deducts stock, and verifies idempotency atomically
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_customer_id UUID,
  p_address_id UUID,
  p_cart_items JSONB,
  p_delivery_option_id TEXT DEFAULT 'standard',
  p_payment_method TEXT DEFAULT 'cod',
  p_coupon_code TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_order RECORD;
  v_totals JSONB;
  v_order_id UUID;
  v_order_number TEXT;
  v_item RECORD;
  v_product RECORD;
  v_product_id UUID;
  v_quantity INTEGER;
  v_unit_price NUMERIC(10, 2);
  v_total_price NUMERIC(10, 2);
  v_order_status TEXT;
  v_payment_status TEXT;
BEGIN
  -- Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, order_number, total_amount, payment_status, order_status
    INTO v_existing_order
    FROM public.orders
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'total_amount', v_existing_order.total_amount,
        'is_duplicate', true
      );
    END IF;
  END IF;

  -- Verify Address Ownership
  IF NOT EXISTS (SELECT 1 FROM public.addresses WHERE id = p_address_id AND user_id = p_customer_id)
     AND NOT EXISTS (SELECT 1 FROM public.customer_addresses WHERE id = p_address_id AND user_id = p_customer_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or unauthorized delivery address');
  END IF;

  -- Calculate totals securely on server
  v_totals := public.calculate_checkout_total(p_cart_items, p_coupon_code, p_delivery_option_id);
  IF NOT (v_totals->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object('success', false, 'error', v_totals->>'error', 'details', v_totals->'invalid_items');
  END IF;

  -- Generate unique order number
  v_order_number := 'SS-' || to_char(timezone('utc'::text, now()), 'YYYYMMDD') || '-' || LPAD(FLOOR(random() * 10000)::TEXT, 4, '0');

  v_payment_status := 'pending';
  IF LOWER(p_payment_method) = 'cod' THEN
    v_order_status := 'confirmed';
  ELSE
    v_order_status := 'pending';
  END IF;

  -- Insert order
  INSERT INTO public.orders (
    order_number,
    user_id,
    customer_id,
    address_id,
    subtotal,
    product_discount,
    coupon_discount,
    delivery_fee,
    total_amount,
    delivery_option_id,
    payment_method,
    payment_status,
    order_status,
    coupon_code,
    idempotency_key
  ) VALUES (
    v_order_number,
    p_customer_id,
    p_customer_id,
    p_address_id,
    (v_totals->>'item_subtotal')::NUMERIC,
    (v_totals->>'product_discounts')::NUMERIC,
    (v_totals->>'coupon_discount')::NUMERIC,
    (v_totals->>'delivery_fee')::NUMERIC,
    (v_totals->>'final_payable_amount')::NUMERIC,
    p_delivery_option_id,
    p_payment_method,
    v_payment_status,
    v_order_status,
    p_coupon_code,
    p_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- Insert order items & reduce stock atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_product_id := (v_item.value->>'product_id')::UUID;
    v_quantity := COALESCE((v_item.value->>'quantity')::INTEGER, 1);

    -- Select with FOR UPDATE to prevent race-condition overselling
    SELECT id, name, price, artisan_id, image_url, stock
    INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Stock oversell prevented: Product % has only % left', v_product.name, v_product.stock;
    END IF;

    -- Decrement stock safely
    UPDATE public.products
    SET stock = stock - v_quantity
    WHERE id = v_product_id;

    v_unit_price := v_product.price;
    v_total_price := v_unit_price * v_quantity;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      artisan_id,
      product_name,
      product_name_snapshot,
      product_image_snapshot,
      price,
      unit_price,
      quantity,
      total_price
    ) VALUES (
      v_order_id,
      v_product_id,
      v_product.artisan_id,
      v_product.name,
      v_product.name,
      v_product.image_url,
      v_unit_price,
      v_unit_price,
      v_quantity,
      v_total_price
    );
  END LOOP;

  -- Clear cart after successful transaction
  DELETE FROM public.cart_items WHERE user_id = p_customer_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', (v_totals->>'final_payable_amount')::NUMERIC,
    'payment_method', p_payment_method,
    'order_status', v_order_status
  );
END;
$$;

-- 9. Cancellation & Stock Restoration RPC
CREATE OR REPLACE FUNCTION public.cancel_order_and_restore_stock(p_order_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND (user_id = p_user_id OR customer_id = p_user_id);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or unauthorized');
  END IF;

  IF v_order.order_status IN ('cancelled', 'delivered') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order cannot be cancelled in its current state');
  END IF;

  -- Restore stock for all products in order
  FOR v_item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.products
    SET stock = stock + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  UPDATE public.orders
  SET order_status = 'cancelled', updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'message', 'Order cancelled and inventory restored');
END;
$$;

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies
-- Addresses: Customers can only manage their own addresses
DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
CREATE POLICY "addresses_insert_own" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
CREATE POLICY "addresses_update_own" ON public.addresses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
CREATE POLICY "addresses_delete_own" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Delivery options: Read-only for authenticated & anon
DROP POLICY IF EXISTS "delivery_options_read_all" ON public.delivery_options;
CREATE POLICY "delivery_options_read_all" ON public.delivery_options FOR SELECT USING (is_active = true);

-- Orders: Customer can view their own orders
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id OR auth.uid() = customer_id);

-- Payments: Customer can view own payments
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = customer_id);

-- 12. Permissions
GRANT EXECUTE ON FUNCTION public.calculate_checkout_total(JSONB, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(UUID, UUID, JSONB, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_and_restore_stock(UUID, UUID) TO authenticated;

