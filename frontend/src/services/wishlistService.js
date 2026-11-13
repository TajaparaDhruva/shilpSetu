/**
 * wishlistService.js — User Wishlist Service for ShilpSetu
 *
 * Implements authenticated user-specific wishlist operations.
 * Enforces authenticated session boundaries, duplicate prevention,
 * and active product association.
 */

import { getCurrentUser, getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// In-memory wishlist cache for guest or fallback offline sessions
const localWishlistCache = new Set();

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
 * Get all wishlist items for the authenticated user
 * @param {string} [userId] - Optional; falls back to current authenticated user
 */
export async function getWishlist(userId = null) {
  const token = getAccessToken();
  const user = userId ? { id: userId } : await getCurrentUser();

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Array.from(localWishlistCache);
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wishlist?user_id=eq.${user.id}&select=id,product_id,created_at,products(*)`,
      { headers: authHeaders(token) }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        // Synchronize local cache with user's product IDs
        localWishlistCache.clear();
        data.forEach((item) => {
          if (item.product_id) localWishlistCache.add(item.product_id);
        });
        return data;
      }
    }
  } catch {
    // Network fallback
  }

  return Array.from(localWishlistCache);
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
  } catch {
    // Fall back to local cache
  }

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

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: true, localOnly: true, productId, in_wishlist: true };
  }

  try {
    // 1. Try secure RPC function first
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/add_to_wishlist_safe`, {
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

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: true, localOnly: true, productId, in_wishlist: false };
  }

  try {
    // 1. Try secure RPC function first
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/remove_from_wishlist_safe`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ p_product_id: productId }),
    });

    if (rpcRes.ok) {
      return await rpcRes.json();
    }

    // 2. Direct delete fallback
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
