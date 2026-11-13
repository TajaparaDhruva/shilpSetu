/**
 * addressService.js — Address management for ShilpSetu checkout flow
 */

import { getCurrentUser, getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function authHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const FALLBACK_ADDRESSES = [
  {
    id: 'fallback-1',
    user_id: null,
    full_name: 'Ravi Sharma',
    address_line1: '12, Nirmala Nagar',
    address_line2: 'Near Trikon Baug',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360001',
    phone: '9876543210',
    is_default: true,
  },
  {
    id: 'fallback-2',
    user_id: null,
    full_name: 'Priya Mehta',
    address_line1: '45B, Satellite Road',
    address_line2: 'Bodakdev',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380054',
    phone: '9988776655',
    is_default: false,
  },
];

/**
 * Fetch all addresses for current user from customer_addresses table.
 * Falls back to FALLBACK_ADDRESSES on error.
 */
export async function getAddresses() {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/customer_addresses?user_id=eq.${user.id}&select=id,user_id,full_name,address_line1,address_line2,city,state,pincode,phone,is_default&order=is_default.desc,created_at.asc`,
        { headers: authHeaders(token) }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // fall through to fallback
    }
  }

  return FALLBACK_ADDRESSES;
}

/**
 * Add a new address for current user.
 * If this is the first address, sets is_default=true automatically.
 */
export async function addAddress(addressData) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !token || !SUPABASE_URL) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const existing = await getAddresses();
    const isFirst = !existing.length || existing[0].id?.startsWith('fallback-');
    const payload = {
      ...addressData,
      user_id: user.id,
      is_default: isFirst ? true : (addressData.is_default || false),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/customer_addresses`, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    const data = await res.json();
    return { success: true, address: Array.isArray(data) ? data[0] : data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Update an existing address by id.
 */
export async function updateAddress(id, addressData) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !token || !SUPABASE_URL) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/customer_addresses?id=eq.${id}&user_id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          ...authHeaders(token),
          Prefer: 'return=representation',
        },
        body: JSON.stringify(addressData),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    const data = await res.json();
    return { success: true, address: Array.isArray(data) ? data[0] : data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Delete an address by id.
 */
export async function deleteAddress(id) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !token || !SUPABASE_URL) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/customer_addresses?id=eq.${id}&user_id=eq.${user.id}`,
      {
        method: 'DELETE',
        headers: authHeaders(token),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Set an address as default: unset all, then set target.
 */
export async function setDefaultAddress(id) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !token || !SUPABASE_URL) {
    FALLBACK_ADDRESSES.forEach((a) => {
      a.is_default = a.id === id;
    });
    return { success: true };
  }

  try {
    // Unset all defaults for this user
    await fetch(
      `${SUPABASE_URL}/rest/v1/customer_addresses?user_id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ is_default: false }),
      }
    );

    // Set the target as default
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/customer_addresses?id=eq.${id}&user_id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          ...authHeaders(token),
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ is_default: true }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Get the default address for current user.
 */
export async function getDefaultAddress() {
  const addresses = await getAddresses();
  if (!Array.isArray(addresses) || addresses.length === 0) return null;
  return addresses.find((a) => a.is_default) || addresses[0];
}

/**
 * Validate a 6-digit Indian pincode.
 */
export function validatePincode(pincode) {
  return /^\d{6}$/.test(String(pincode));
}

/**
 * Validate address data fields.
 * Returns { valid: bool, errors: {} }
 */
export function validateAddress(data) {
  const errors = {};

  if (!data.full_name || String(data.full_name).trim().length < 2) {
    errors.full_name = 'Full name is required';
  }
  if (!data.address_line1 || String(data.address_line1).trim().length < 5) {
    errors.address_line1 = 'Address line 1 is required (min 5 chars)';
  }
  if (!data.city || String(data.city).trim().length < 2) {
    errors.city = 'City is required';
  }
  if (!data.state || String(data.state).trim().length < 2) {
    errors.state = 'State is required';
  }
  if (!validatePincode(data.pincode)) {
    errors.pincode = 'Enter a valid 6-digit pincode';
  }
  if (!data.phone || !/^\d{10}$/.test(String(data.phone).trim())) {
    errors.phone = 'Enter a valid 10-digit phone number';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
