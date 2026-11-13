/**
 * cartService.js — In-Memory & Supabase Cart Service for ShilpSetu
 */

import { getCurrentUser, getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// In-memory cart storage for session resilience
const localCart = new Map();

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
 * Add a product to the cart
 * @param {Object} product - Product object
 * @param {number} quantity - Quantity to add (default 1)
 */
export async function addToCart(product, quantity = 1) {
  if (!product || !product.id) {
    return { success: false, error: 'Valid product required' };
  }

  const existing = localCart.get(product.id);
  const newQty = (existing ? existing.quantity : 0) + quantity;

  // Validate stock
  if (product.stock && newQty > product.stock) {
    return {
      success: false,
      error: `Only ${product.stock} items in stock`,
      currentQty: existing ? existing.quantity : 0,
    };
  }

  localCart.set(product.id, {
    product,
    quantity: newQty,
    addedAt: new Date().toISOString(),
  });

  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/cart`, {
        method: 'POST',
        headers: {
          ...authHeaders(token),
          Prefer: 'return=representation,resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: user.id,
          product_id: product.id,
          quantity: newQty,
        }),
      });
    } catch {
      // In-memory fallback succeeds
    }
  }

  return {
    success: true,
    totalItems: getCartCount(),
    quantity: newQty,
  };
}

/**
 * Get total count of items in cart
 */
export function getCartCount() {
  let count = 0;
  for (const item of localCart.values()) {
    count += item.quantity;
  }
  return count;
}

/**
 * Get all cart items
 */
export async function getCart() {
  return Array.from(localCart.values());
}

