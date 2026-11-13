/**
 * profileService.js — Profile & Role service for ShilpSetu
 *
 * Clean facade over the Supabase REST API for profile operations.
 * Uses the same Supabase credentials and session as auth.js (no duplicate client).
 *
 * Exported functions:
 *   setUserRole(role)    — calls set_user_role RPC
 *   getUserRole()        — returns { role, profileExists, error }
 *   getUserProfile()     — returns full profile object or null
 *   getArtisanProfile()  — returns artisan_profiles record or null
 */

import { getCurrentUser, getAccessToken } from './auth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ── Helpers ─────────────────────────────────────────────────

/** Standard headers for authenticated Supabase REST requests. */
function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
  };
}

/** Assert Supabase is configured. */
function assertConfigured() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes('your_supabase_project_url')
  ) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
  }
}

// ── Public API ──────────────────────────────────────────────

/**
 * Set the authenticated user's role via the set_user_role RPC.
 *
 * @param {'customer' | 'artisan'} role
 * @returns {Promise<{ success: boolean, role: string, message?: string }>}
 * @throws {Error} on network failure, invalid role, or duplicate call
 */
export async function setUserRole(role) {
  assertConfigured();

  if (!role || !['customer', 'artisan'].includes(role)) {
    throw new Error('Invalid role. Must be "customer" or "artisan".');
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please log in first.');
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // ignore
  }
  const userId = user?.id;

  // 1. Try RPC with selected_role
  let response;
  let data;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_user_role`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ selected_role: role }),
    });
    data = await response.json();
  } catch (err) {
    // network issue, proceed to check
  }

  // 2. If selected_role was not found in schema cache, try new_role
  const isSchemaError =
    !response ||
    response.status === 404 ||
    data?.message?.includes('schema cache') ||
    data?.hint?.includes('selected_role') ||
    data?.error?.includes('schema cache');

  if (isSchemaError) {
    try {
      response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_user_role`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ new_role: role }),
      });
      data = await response.json();
    } catch (err) {
      // ignore
    }
  }

  // 3. Fallback: Direct table update if RPC isn't found in Supabase
  const isStillSchemaError =
    !response ||
    response.status === 404 ||
    data?.message?.includes('schema cache') ||
    data?.error?.includes('schema cache');

  if (isStillSchemaError && userId) {
    try {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
        {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ role, updated_at: new Date().toISOString() }),
        }
      );

      if (updateRes.ok) {
        if (role === 'artisan') {
          await fetch(`${SUPABASE_URL}/rest/v1/artisan_profiles`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ user_id: userId }),
          }).catch(() => {});
        }
        return { success: true, role };
      }
    } catch {
      // ignore
    }
  }

  if (!response || !response.ok) {
    throw new Error(
      data?.message || data?.hint || data?.error || 'Failed to set role.'
    );
  }

  // The RPC returns a JSON object with { success, role, error? }
  if (data && data.success === false) {
    throw new Error(data.error || 'Failed to set role.');
  }

  return data;
}

/**
 * Get the authenticated user's role.
 *
 * Returns a structured result that separates "no profile" from "profile exists
 * but role is NULL" from "profile fetch failed".
 *
 * @returns {Promise<{ role: string|null, profileExists: boolean, error: string|null }>}
 */
export async function getUserRole() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { role: null, profileExists: false, error: 'NOT_AUTHENTICATED' };
    }

    const profile = await getUserProfile();
    if (!profile) {
      return { role: null, profileExists: false, error: null };
    }

    return { role: profile.role || null, profileExists: true, error: null };
  } catch (err) {
    return {
      role: null,
      profileExists: false,
      error: err.message || 'PROFILE_FETCH_FAILED',
    };
  }
}

/**
 * Get the authenticated user's full profile from the profiles table.
 *
 * @returns {Promise<object|null>} profile row or null
 * @throws {Error} on auth or network failure
 */
export async function getUserProfile(userId = null) {
  assertConfigured();

  const user = userId ? { id: userId } : await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required to access profile.');
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please log in first.');
  }

  const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=*`;

  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.hint || 'Failed to retrieve profile.');
  }

  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }

  return null;
}

/**
 * Get the authenticated user's artisan profile (if they are an artisan).
 *
 * @returns {Promise<object|null>} artisan_profiles row or null
 * @throws {Error} on auth or network failure
 */
export async function getArtisanProfile() {
  assertConfigured();

  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required.');
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please log in first.');
  }

  const url = `${SUPABASE_URL}/rest/v1/artisan_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=*`;

  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || data.hint || 'Failed to retrieve artisan profile.'
    );
  }

  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }

  return null;
}

