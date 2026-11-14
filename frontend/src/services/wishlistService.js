/**
 * wishlistService.js — User Wishlist Service for ShilpSetu
 *
 * Implements authenticated user-specific wishlist operations.
 * Enforces authenticated session boundaries, duplicate prevention,
 * and active product association with persistent Supabase backend.
 */

import { getCurrentUser, getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// In-memory wishlist cache for current authenticated session (starts empty)
const localWishlistCache = new Set();
const localWishlistProducts = new Map();

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
 * Reset local session wishlist cache on logout
 */
export function resetLocalWishlistCache() {
  localWishlistCache.clear();
  localWishlistProducts.clear();
}

/**
 * Get all wishlist items for the authenticated user
 * @param {string} [userId] - Optional; falls back to current authenticated user
 */
export async function getWishlist(userId = null) {
  const token = getAccessToken();
  const user = userId ? { id: userId } : await getCurrentUser();

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Array.from(localWishlistProducts.values());
  }

  // 1. Try secure RPC function
  try {
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_wishlist_details`, {
      method: 'POST',
      headers: authHeaders(token),
    });

    if (rpcRes.ok) {
      const rpcData = await rpcRes.json();
      if (rpcData && rpcData.success && Array.isArray(rpcData.items)) {
        localWishlistCache.clear();
        localWishlistProducts.clear();
        rpcData.items.forEach((item) => {
          if (item.product_id) {
            localWishlistCache.add(item.product_id);
            localWishlistProducts.set(item.product_id, item);
          }
        });
        return rpcData.items;
      }
    }
  } catch {}

  // 2. Direct table select fallback
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wishlist?user_id=eq.${user.id}&select=id,product_id,created_at,products(*)`,
      { headers: authHeaders(token) }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localWishlistCache.clear();
        localWishlistProducts.clear();
        data.forEach((item) => {
          if (item.product_id) {
            localWishlistCache.add(item.product_id);
            localWishlistProducts.set(item.product_id, item);
          }
        });
        return data;
      }
    }
  } catch {}

  return Array.from(localWishlistProducts.values());
}

/**
 * Check whether a product is in the user's wishlist
 * @param {string} productId
 */
export async function checkWishlist(productId) {
  if (!productId) return false;

  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return localWishlistCache.has(productId);
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_wishlist`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ p_product_id: productId }),
    });

    if (res.ok) {
      const exists = await res.json();
      if (typeof exists === 'boolean') {
        if (exists) localWishlistCache.add(productId);
        else localWishlistCache.delete(productId);
        return exists;
      }
    }
  } catch {}

  return localWishlistCache.has(productId);
}

// Backward compatible alias
export const isInWishlist = (productId) => localWishlistCache.has(productId);

/**
 * Add a product to the user's wishlist
 * @param {string} productId
 */
export async function addToWishlist(productId) {
  if (!productId) {
    return { success: false, error: 'Product ID is required' };
  }

  const token = getAccessToken();
  const user = await getCurrentUser();

  localWishlistCache.add(productId);
  localWishlistProducts.set(productId, { product_id: productId, in_wishlist: true });

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: true, localOnly: true, productId, in_wishlist: true };
  }

  try {
    // 1. Try secure persistent RPC function first
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/add_to_wishlist_persistent`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ p_product_id: productId }),
    });

    if (rpcRes.ok) {
      const data = await rpcRes.json();
      return data;
    }

    // 2. Direct table upsert fallback
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishlist`, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        Prefer: 'return=representation,resolution=ignore-duplicates',
      },
      body: JSON.stringify({
        user_id: user.id,
        product_id: productId,
      }),
    });

    if (res.ok) {
      return { success: true, product_id: productId, in_wishlist: true };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Failed to add to wishlist' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove a product from the user's wishlist
 * @param {string} productId
 */
export async function removeFromWishlist(productId) {
  if (!productId) {
    return { success: false, error: 'Product ID is required' };
  }

  const token = getAccessToken();
  const user = await getCurrentUser();

  localWishlistCache.delete(productId);
  localWishlistProducts.delete(productId);

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: true, localOnly: true, productId, in_wishlist: false };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wishlist?user_id=eq.${user.id}&product_id=eq.${productId}`,
      {
        method: 'DELETE',
        headers: authHeaders(token),
      }
    );

    if (res.ok) {
      return { success: true, product_id: productId, in_wishlist: false };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Failed to remove from wishlist' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Toggle product in wishlist
 * @param {string} productId
 */
export async function toggleWishlist(productId) {
  const isCurrentlyIn = localWishlistCache.has(productId);
  if (isCurrentlyIn) {
    const res = await removeFromWishlist(productId);
    return { inWishlist: false, ...res };
  } else {
    const res = await addToWishlist(productId);
    return { inWishlist: true, ...res };
  }
}
