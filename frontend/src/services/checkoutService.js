/**
 * checkoutService.js — Checkout Utilities for ShilpSetu
 *
 * Provides price calculation, cart validation, and delivery options.
 * Does not persist checkout sessions to the DB — order creation happens
 * at payment time via orderService.
 */

import { getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ─── Delivery options ─────────────────────────────────────────────────────────

export const FALLBACK_DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', days: '3-5 Days', charge: 49 },
  { id: 'express', label: 'Express Delivery', days: '1-2 Days', charge: 99 },
];

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

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Get available delivery options
 * @returns {Array}
 */
export function getDeliveryOptions() {
  return FALLBACK_DELIVERY_OPTIONS;
}

/**
 * Validate all cart items have sufficient stock (re-checks DB)
 * @param {Array} cartItems - Array of { product: { id, stock }, quantity }
 * @returns {Promise<{ valid: boolean, invalidItems: Array, message: string }>}
 */
export async function validateCartForCheckout(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { valid: false, invalidItems: [], message: 'Your cart is empty' };
  }

  const token = getAccessToken();
  const invalidItems = [];

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // No DB access — do local stock check only
    for (const item of cartItems) {
      const stock = item.product?.stock ?? item.stock ?? Infinity;
      if (stock <= 0) {
        invalidItems.push({
          ...item,
          reason: 'Out of stock',
        });
      } else if (item.quantity > stock) {
        invalidItems.push({
          ...item,
          reason: `Only ${stock} available`,
          availableStock: stock,
        });
      }
    }
    return {
      valid: invalidItems.length === 0,
      invalidItems,
      message:
        invalidItems.length > 0
          ? `${invalidItems.length} item(s) have stock issues`
          : 'Cart is valid',
    };
  }

  // Re-verify stock from DB in one request
  const productIds = cartItems
    .map((item) => item.product?.id || item.product_id)
    .filter(Boolean);

  if (productIds.length === 0) {
    return { valid: false, invalidItems: [], message: 'No valid products in cart' };
  }

  try {
    const idsParam = productIds.map((id) => `"${id}"`).join(',');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=in.(${idsParam})&select=id,stock,name,is_active`,
      { headers: authHeaders(token) }
    );

    if (res.ok) {
      const freshProducts = await res.json();
      const stockMap = {};
      if (Array.isArray(freshProducts)) {
        for (const p of freshProducts) {
          stockMap[p.id] = p;
        }
      }

      for (const item of cartItems) {
        const productId = item.product?.id || item.product_id;
        const fresh = stockMap[productId];

        if (!fresh) {
          invalidItems.push({ ...item, reason: 'Product not found' });
        } else if (fresh.is_active === false) {
          invalidItems.push({ ...item, reason: 'Product no longer available' });
        } else if ((fresh.stock ?? 0) <= 0) {
          invalidItems.push({ ...item, reason: 'Out of stock' });
        } else if (item.quantity > fresh.stock) {
          invalidItems.push({
            ...item,
            reason: `Only ${fresh.stock} available`,
            availableStock: fresh.stock,
          });
        }
      }
    } else {
      // DB check failed — fall back to local stock from cart items
      for (const item of cartItems) {
        const stock = item.product?.stock ?? Infinity;
        if (stock <= 0) {
          invalidItems.push({ ...item, reason: 'Out of stock' });
        } else if (item.quantity > stock) {
          invalidItems.push({
            ...item,
            reason: `Only ${stock} available`,
            availableStock: stock,
          });
        }
      }
    }
  } catch {
    // Network error: use local values
    for (const item of cartItems) {
      const stock = item.product?.stock ?? Infinity;
      if (stock !== Infinity && item.quantity > stock) {
        invalidItems.push({
          ...item,
          reason: `Only ${stock} available`,
          availableStock: stock,
        });
      }
    }
  }

  return {
    valid: invalidItems.length === 0,
    invalidItems,
    message:
      invalidItems.length > 0
        ? `${invalidItems.length} item(s) have stock issues`
        : 'Cart is valid for checkout',
  };
}

/**
 * Calculate the full price breakdown for the checkout summary
 * @param {Array} cartItems - Array of { product: { price, original_price }, quantity }
 * @param {number} deliveryCharge - Flat delivery charge in ₹
 * @param {number} couponDiscount - Coupon discount amount in ₹
 * @returns {{ itemTotal: number, productDiscount: number, couponDiscount: number, deliveryCharge: number, totalAmount: number }}
 */
export function calculatePriceSummary(cartItems, deliveryCharge = 49, couponDiscount = 0) {
  let itemTotal = 0;
  let productDiscount = 0;

  if (Array.isArray(cartItems)) {
    for (const item of cartItems) {
      const price = Number(item.product?.price ?? item.price ?? 0);
      const originalPrice = Number(item.product?.original_price ?? item.original_price ?? 0);
      const qty = Number(item.quantity ?? 1);

      itemTotal += price * qty;

      if (originalPrice > price) {
        productDiscount += (originalPrice - price) * qty;
      }
    }
  }

  const delivery = Number(deliveryCharge) || 0;
  const coupon = Number(couponDiscount) || 0;

  // Clamp discounts so total never goes negative
  const effectiveCoupon = Math.min(coupon, itemTotal);
  const totalAmount = Math.max(0, itemTotal - effectiveCoupon + delivery);

  return {
    itemTotal: Math.round(itemTotal * 100) / 100,
    productDiscount: Math.round(productDiscount * 100) / 100,
    couponDiscount: Math.round(effectiveCoupon * 100) / 100,
    deliveryCharge: delivery,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Create a local (non-persisted) checkout session object
 * @param {Array} cartItems
 * @param {string} addressId
 * @param {string} deliveryOption - 'standard' | 'express'
 * @param {Object|null} appliedCoupon
 * @returns {Object} checkout session
 */
export function createCheckoutSession(cartItems, addressId, deliveryOption, appliedCoupon) {
  const options = getDeliveryOptions();
  const selectedOption = options.find((o) => o.id === deliveryOption) || options[0];
  const deliveryCharge = selectedOption.charge;
  const couponDiscount = appliedCoupon?.discount_amount ?? 0;

  const priceSummary = calculatePriceSummary(cartItems, deliveryCharge, couponDiscount);

  return {
    id: `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    cartItems,
    addressId,
    deliveryOption: selectedOption,
    appliedCoupon,
    priceSummary,
    createdAt: new Date().toISOString(),
  };
}
