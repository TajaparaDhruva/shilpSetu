/**
 * couponService.js — Coupon Validation & Application for ShilpSetu
 *
 * Validates coupons against the Supabase `coupons` table with in-memory
 * cache for the currently applied coupon.
 * Supports offline demo coupons: DEMO10, FLAT50
 */

import { getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ─── In-memory state ──────────────────────────────────────────────────────────

let _appliedCoupon = null;

// ─── Fallback / Demo coupons ──────────────────────────────────────────────────

export const FALLBACK_COUPONS = {
  DEMO10: {
    code: 'DEMO10',
    discount_type: 'percent',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 100,
    is_active: true,
  },
  FLAT50: {
    code: 'FLAT50',
    discount_type: 'flat',
    discount_value: 50,
    min_order_amount: 200,
    max_discount_amount: null,
    is_active: true,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function computeDiscount(coupon, cartTotal) {
  if (coupon.discount_type === 'flat') {
    const discount = Number(coupon.discount_value);
    return Math.min(discount, cartTotal);
  }
  if (coupon.discount_type === 'percent') {
    const percent = Number(coupon.discount_value);
    const raw = (cartTotal * percent) / 100;
    return coupon.max_discount_amount
      ? Math.min(raw, Number(coupon.max_discount_amount))
      : raw;
  }
  return 0;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Validate a coupon code against the database or fallback list
 * @param {string} code
 * @param {number} cartTotal - Current cart subtotal in ₹
 * @returns {Promise<{ valid: boolean, discount_type?: string, discount_value?: number, discount_amount?: number, coupon?: Object, error?: string }>}
 */
export async function validateCoupon(code, cartTotal) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Please enter a coupon code' };
  }

  const normalizedCode = code.trim().toUpperCase();
  const total = Number(cartTotal) || 0;

  const token = getAccessToken();

  // ── Try DB first ──────────────────────────────────────────────────────────
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(normalizedCode)}&limit=1`,
        { headers: authHeaders(token) }
      );

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const coupon = rows[0];

          if (!coupon.is_active) {
            return { valid: false, error: 'This coupon is no longer active' };
          }

          if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
            return { valid: false, error: 'This coupon has expired' };
          }

          if (coupon.min_order_amount && total < Number(coupon.min_order_amount)) {
            return {
              valid: false,
              error: `Minimum order amount ₹${coupon.min_order_amount} required for this coupon`,
            };
          }

          const discount_amount = computeDiscount(coupon, total);
          return {
            valid: true,
            discount_type: coupon.discount_type,
            discount_value: Number(coupon.discount_value),
            discount_amount: Math.round(discount_amount * 100) / 100,
            coupon,
          };
        }

        // Code not found in DB — fall through to demo coupons
      }
    } catch {
      // Network error — fall through to demo coupons
    }
  }

  // ── Offline / demo fallback ───────────────────────────────────────────────
  const demo = FALLBACK_COUPONS[normalizedCode];
  if (demo) {
    if (demo.min_order_amount && total < demo.min_order_amount) {
      return {
        valid: false,
        error: `Minimum order amount ₹${demo.min_order_amount} required for this coupon`,
      };
    }
    const discount_amount = computeDiscount(demo, total);
    return {
      valid: true,
      discount_type: demo.discount_type,
      discount_value: demo.discount_value,
      discount_amount: Math.round(discount_amount * 100) / 100,
      coupon: demo,
    };
  }

  return { valid: false, error: 'Invalid or unrecognised coupon code' };
}

/**
 * Apply a coupon: validates then stores it in memory
 * @param {string} code
 * @param {number} cartTotal
 * @returns {Promise<{ success: boolean, couponState?: Object, error?: string }>}
 */
export async function applyCoupon(code, cartTotal) {
  const result = await validateCoupon(code, cartTotal);

  if (!result.valid) {
    return { success: false, error: result.error };
  }

  _appliedCoupon = {
    code: (result.coupon?.code || code).toUpperCase(),
    discount_type: result.discount_type,
    discount_value: result.discount_value,
    discount_amount: result.discount_amount,
    coupon: result.coupon,
    appliedAt: new Date().toISOString(),
  };

  return { success: true, couponState: _appliedCoupon };
}

/**
 * Remove any currently applied coupon from in-memory state
 * @returns {{ success: boolean }}
 */
export function removeCoupon() {
  _appliedCoupon = null;
  return { success: true };
}

/**
 * Get the currently applied coupon (in-memory)
 * @returns {Object|null}
 */
export function getAppliedCoupon() {
  return _appliedCoupon;
}
