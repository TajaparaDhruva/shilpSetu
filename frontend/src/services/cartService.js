/**
 * cartService.js — In-Memory & Supabase Cart Service for ShilpSetu
 *
 * Implements authenticated cart operations with stock bounds checking,
 * duplicate handling via `add_to_cart_item` RPC and `cart_items` table.
 */

import { getCurrentUser, getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// In-memory cart storage for session resilience & instant UI feedback
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
 * Add a product to the user's cart
 * Validates stock, prevents duplicate rows, updates quantity
 *
 * @param {string|Object} productOrId - Product object or UUID string
 * @param {number} quantity - Quantity to add (default 1)
 */
export async function addToCart(productOrId, quantity = 1) {
  const productId = typeof productOrId === 'object' ? productOrId.id : productOrId;
  const productObj = typeof productOrId === 'object' ? productOrId : { id: productId };

  if (!productId) {
    return { success: false, error: 'Valid product required' };
  }

  const existing = localCart.get(productId);
  const newQty = (existing ? existing.quantity : 0) + quantity;

  // Local stock validation if stock is present on object
  if (productObj.stock !== undefined && newQty > productObj.stock) {
    return {
      success: false,
      error: `Only ${productObj.stock} item(s) available in stock`,
      available_stock: productObj.stock,
      currentQty: existing ? existing.quantity : 0,
    };
  }

  // Update in-memory cache
  localCart.set(productId, {
    product: productObj,
    quantity: newQty,
    addedAt: new Date().toISOString(),
  });

  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      // 1. Try atomic database RPC function first
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/add_to_cart_item`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          p_product_id: productId,
          p_quantity: quantity,
        }),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && rpcData.success === false) {
          // Revert local optimistic change if backend reported stock conflict
          if (existing) {
            localCart.set(productId, existing);
          } else {
            localCart.delete(productId);
          }
          return rpcData;
        }
      } else {
        // 2. Direct table upsert fallback
        await fetch(`${SUPABASE_URL}/rest/v1/cart_items`, {
          method: 'POST',
          headers: {
            ...authHeaders(token),
            Prefer: 'return=representation,resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: user.id,
            product_id: productId,
            quantity: newQty,
          }),
        });
      }
    } catch {
      // Offline / fallback operates seamlessly with localCart
    }
  }

  return {
    success: true,
    product_id: productId,
    quantity: newQty,
    totalItems: getCartCount(),
  };
}

/**
 * Get total item count in cart
 */
export function getCartCount() {
  let count = 0;
  for (const item of localCart.values()) {
    count += item.quantity;
  }
  return count;
}

/**
 * Get all cart items for authenticated user
 */
export async function getCart() {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${user.id}&select=*,products(*)`,
        { headers: authHeaders(token) }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localCart.clear();
          data.forEach((item) => {
            localCart.set(item.product_id, {
              product: item.products || { id: item.product_id },
              quantity: item.quantity,
              id: item.id,
            });
          });
        }
      }
    } catch {
      // In-memory returns
    }
  }

  return Array.from(localCart.values());
}
