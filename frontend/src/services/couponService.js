/**
 * couponService.js — Backend Coupon Validation & Application for ShilpSetu
 *
 * Implements:
 * - validateCoupon(code, cartItems)
 * - applyCoupon(code, cartTotal)
 * - removeCoupon()
 * - getAppliedCoupon()
 */

import { getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let _appliedCoupon = null;

export const FALLBACK_COUPONS = {
  WELCOME10: {
    code: 'WELCOME10',
    discount_type: 'percent',
    discount_value: 10,
    minimum_order_amount: 200,
    maximum_discount: 100,
    is_active: true,
  },
  DEMO10: {
    code: 'DEMO10',
    discount_type: 'percent',
    discount_value: 10,
    minimum_order_amount: 100,
    maximum_discount: 100,
    is_active: true,
  },
  FLAT50: {
    code: 'FLAT50',
    discount_type: 'flat',
    discount_value: 50,
    minimum_order_amount: 200,
    maximum_discount: 50,
    is_active: true,
  },
  SHILP200: {
    code: 'SHILP200',
    discount_type: 'flat',
    discount_value: 200,
    minimum_order_amount: 1000,
    maximum_discount: 200,
    is_active: true,
  },
};

function authHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * 1. validateCoupon(code, cartItemsOrTotal)
 */
export async function validateCoupon(code, cartItemsOrTotal = 0) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Coupon code is required' };
  }

  const cleanCode = code.trim().toUpperCase();

  // Compute total if array passed
  let cartTotal = 0;
  if (Array.isArray(cartItemsOrTotal)) {
    for (const item of cartItemsOrTotal) {
      const price = Number(item.product?.price || item.price || 0);
      const qty = Number(item.quantity || 1);
      cartTotal += price * qty;
    }
  } else {
    cartTotal = Number(cartItemsOrTotal) || 0;
  }

  const token = getAccessToken();

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_coupon`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          p_code: cleanCode,
          p_cart_total: cartTotal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          return {
            valid: Boolean(data.valid),
            coupon_code: cleanCode,
            discount_type: data.discount_type || 'flat',
            discount_amount: Number(data.discount_amount || 0),
            error: data.error,
          };
        }
      }
    } catch {}
  }

  // Fallback offline validation
  const coupon = FALLBACK_COUPONS[cleanCode];
  if (!coupon || !coupon.is_active) {
    return { valid: false, error: 'Invalid or expired coupon code' };
  }

  if (cartTotal > 0 && cartTotal < coupon.minimum_order_amount) {
    return {
      valid: false,
      error: `Minimum order of ₹${coupon.minimum_order_amount} required for this coupon`,
    };
  }

  let discount = 0;
  if (coupon.discount_type === 'percent' || coupon.discount_type === 'percentage') {
    discount = (cartTotal * coupon.discount_value) / 100;
    if (coupon.maximum_discount && discount > coupon.maximum_discount) {
      discount = coupon.maximum_discount;
    }
  } else {
    discount = Math.min(coupon.discount_value, cartTotal || coupon.discount_value);
  }

  return {
    valid: true,
    coupon_code: cleanCode,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: Math.round(discount),
  };
}

/**
 * 2. applyCoupon(code, cartTotal)
 */
export async function applyCoupon(code, cartTotal = 0) {
  const result = await validateCoupon(code, cartTotal);
  if (result.valid) {
    _appliedCoupon = result;
  }
  return result;
}

/**
 * 3. removeCoupon()
 */
export function removeCoupon() {
  _appliedCoupon = null;
  return { success: true };
}

/**
 * 4. getAppliedCoupon()
 */
export function getAppliedCoupon() {
  return _appliedCoupon;
}
