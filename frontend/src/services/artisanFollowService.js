/**
 * artisanFollowService.js — Artisan Follow/Unfollow Service for ShilpSetu
 *
 * Implements authenticated customer follow management, preventing duplicate
 * records and self-follows via `artisan_follows` table and secure RPCs.
 */

import { getCurrentUser, getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// In-memory cache for guest/offline follow state
const localFollowSet = new Set();

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
 * Check if the authenticated customer is following this artisan
 * @param {string} artisanId
 */
export async function isFollowingArtisan(artisanId) {
  if (!artisanId) return false;

  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return localFollowSet.has(artisanId);
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_following_artisan`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ p_artisan_id: artisanId }),
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data === 'boolean') {
        if (data) localFollowSet.add(artisanId);
        else localFollowSet.delete(artisanId);
        return data;
      }
    }
  } catch {
    // Return cache
  }

  return localFollowSet.has(artisanId);
}

/**
 * Follow an artisan
 * @param {string} artisanId
 */
export async function followArtisan(artisanId) {
  if (!artisanId) {
    return { success: false, error: 'Artisan ID is required' };
  }

  const token = getAccessToken();
  const user = await getCurrentUser();

  // Prevent self-follow
  if (user && user.id === artisanId) {
    return { success: false, error: 'Customers cannot follow themselves' };
  }

  localFollowSet.add(artisanId);

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: true, is_following: true, localOnly: true };
  }

  try {
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/follow_artisan_safe`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ p_artisan_id: artisanId }),
    });

    if (rpcRes.ok) {
      return await rpcRes.json();
    }

    // Direct table upsert fallback
    const res = await fetch(`${SUPABASE_URL}/rest/v1/artisan_follows`, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        Prefer: 'return=representation,resolution=ignore-duplicates',
      },
      body: JSON.stringify({
        customer_id: user.id,
        artisan_id: artisanId,
      }),
    });

    if (res.ok) {
      return { success: true, is_following: true };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }

  return { success: true, is_following: true };
}

/**
 * Unfollow an artisan
 * @param {string} artisanId
 */
export async function unfollowArtisan(artisanId) {
  if (!artisanId) {
    return { success: false, error: 'Artisan ID is required' };
  }

  const token = getAccessToken();
  const user = await getCurrentUser();

  localFollowSet.delete(artisanId);

  if (!user || !user.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: true, is_following: false, localOnly: true };
  }

  try {
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/unfollow_artisan_safe`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ p_artisan_id: artisanId }),
    });

    if (rpcRes.ok) {
      return await rpcRes.json();
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/artisan_follows?customer_id=eq.${user.id}&artisan_id=eq.${artisanId}`,
      { method: 'DELETE', headers: authHeaders(token) }
    );

    if (res.ok) {
      return { success: true, is_following: false };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }

  return { success: true, is_following: false };
}

