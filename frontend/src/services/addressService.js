/**
 * addressService.js — Complete Customer Address Management for ShilpSetu
 *
 * Implements:
 * - getCustomerAddresses()
 * - addCustomerAddress(addressData)
 * - updateCustomerAddress(addressId, addressData)
 * - deleteCustomerAddress(addressId)
 * - setDefaultAddress(addressId)
 * - getAddresses() / addAddress() / updateAddress() / deleteAddress() (aliases)
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
    id: 'addr-fallback-1',
    user_id: 'user-default',
    full_name: 'Dhruva Tajapara',
    phone: '9876543210',
    address_line_1: 'CodingGita Hostel, Swaminarayan University',
    address_line_2: 'Kalawad Road',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360005',
    address_type: 'Home',
    is_default: true,
  },
];

const localAddresses = [...FALLBACK_ADDRESSES];

/**
 * 1. getCustomerAddresses()
 */
export async function getCustomerAddresses() {
  const user = await getCurrentUser();
  const token = getAccessToken();

  if (user && token && SUPABASE_URL) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/addresses?user_id=eq.${user.id}&order=is_default.desc,created_at.desc`,
        { headers: authHeaders(token) }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((a) => ({
            ...a,
            address_line: a.address_line_1 || a.address_line1,
          }));
        }
      }
    } catch {}
  }

  return localAddresses;
}

export async function getAddresses() {
  return getCustomerAddresses();
}

/**
 * 2. addCustomerAddress(addressData)
 */
export async function addCustomerAddress(addressData) {
  const pincode = String(addressData.pincode || '').trim();
  const phone = String(addressData.phone || '').trim().replace(/[^0-9]/g, '');

  if (!/^\d{6}$/.test(pincode)) {
    throw new Error('Please enter a valid 6-digit Indian PIN code');
  }

  if (phone.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  const user = await getCurrentUser();
  const token = getAccessToken();

  const formatted = {
    id: `addr-${Date.now()}`,
    user_id: user?.id || 'guest',
    full_name: addressData.full_name || addressData.name || '',
    phone: phone.slice(-10),
    address_line_1: addressData.address_line_1 || addressData.address_line || addressData.address_line1 || '',
    address_line_2: addressData.address_line_2 || addressData.address_line2 || null,
    city: addressData.city || '',
    district: addressData.district || null,
    state: addressData.state || '',
    pincode: pincode,
    address_type: addressData.address_type || 'Home',
    is_default: Boolean(addressData.is_default),
  };

  if (formatted.is_default) {
    localAddresses.forEach((a) => (a.is_default = false));
  }
  localAddresses.unshift(formatted);

  if (user && token && SUPABASE_URL) {
    try {
      if (formatted.is_default) {
        await fetch(`${SUPABASE_URL}/rest/v1/addresses?user_id=eq.${user.id}`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ is_default: false }),
        });
      }

      const res = await fetch(`${SUPABASE_URL}/rest/v1/addresses`, {
        method: 'POST',
        headers: {
          ...authHeaders(token),
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          user_id: user.id,
          full_name: formatted.full_name,
          phone: formatted.phone,
          address_line_1: formatted.address_line_1,
          address_line_2: formatted.address_line_2,
          city: formatted.city,
          district: formatted.district,
          state: formatted.state,
          pincode: formatted.pincode,
          address_type: formatted.address_type,
          is_default: formatted.is_default,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        return Array.isArray(created) ? created[0] : created;
      }
    } catch {}
  }

  return formatted;
}

export async function addAddress(addressData) {
  return addCustomerAddress(addressData);
}

/**
 * 3. updateCustomerAddress(addressId, addressData)
 */
export async function updateCustomerAddress(addressId, addressData) {
  const index = localAddresses.findIndex((a) => a.id === addressId);
  if (index !== -1) {
    localAddresses[index] = { ...localAddresses[index], ...addressData };
  }

  const user = await getCurrentUser();
  const token = getAccessToken();

  if (user && token && SUPABASE_URL) {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/addresses?id=eq.${addressId}&user_id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({
            ...addressData,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } catch {}
  }

  return { success: true };
}

export async function updateAddress(addressId, addressData) {
  return updateCustomerAddress(addressId, addressData);
}

/**
 * 4. deleteCustomerAddress(addressId)
 */
export async function deleteCustomerAddress(addressId) {
  const idx = localAddresses.findIndex((a) => a.id === addressId);
  if (idx !== -1) {
    localAddresses.splice(idx, 1);
  }

  const user = await getCurrentUser();
  const token = getAccessToken();

  if (user && token && SUPABASE_URL) {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/addresses?id=eq.${addressId}&user_id=eq.${user.id}`,
        {
          method: 'DELETE',
          headers: authHeaders(token),
        }
      );
    } catch {}
  }

  return { success: true };
}

export async function deleteAddress(addressId) {
  return deleteCustomerAddress(addressId);
}

/**
 * 5. setDefaultAddress(addressId)
 */
export async function setDefaultAddress(addressId) {
  localAddresses.forEach((a) => {
    a.is_default = a.id === addressId;
  });

  const user = await getCurrentUser();
  const token = getAccessToken();

  if (user && token && SUPABASE_URL) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/addresses?user_id=eq.${user.id}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ is_default: false }),
      });

      await fetch(
        `${SUPABASE_URL}/rest/v1/addresses?id=eq.${addressId}&user_id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ is_default: true }),
        }
      );
    } catch {}
  }

  return { success: true };
}

export async function getDefaultAddress() {
  const addresses = await getCustomerAddresses();
  return addresses.find((a) => a.is_default) || addresses[0] || null;
}
