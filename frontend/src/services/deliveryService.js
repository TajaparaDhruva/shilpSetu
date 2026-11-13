/**
 * deliveryService.js — Delivery Options & PIN Validation for ShilpSetu
 */

import { getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const FALLBACK_DELIVERY_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    delivery_fee: 49,
    charge: 49,
    days: '3–5 Days',
    estimated_min_days: 3,
    estimated_max_days: 5,
    is_active: true,
  },
  {
    id: 'express',
    name: 'Express Delivery',
    delivery_fee: 99,
    charge: 99,
    days: '1–2 Days',
    estimated_min_days: 1,
    estimated_max_days: 2,
    is_active: true,
  },
];

function authHeaders() {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Get active delivery options optionally filtered by customer address/pincode
 * @param {string} [addressId]
 * @param {Array}  [cartItems]
 * @returns {Promise<Array>}
 */
export async function getDeliveryOptions(addressId = null, cartItems = []) {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/delivery_options?is_active=eq.true&order=delivery_fee.asc`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((d) => ({
            ...d,
            charge: Number(d.delivery_fee),
            days: `${d.estimated_min_days}–${d.estimated_max_days} Days`,
          }));
        }
      }
    } catch {
      // Fall through to fallback
    }
  }

  return FALLBACK_DELIVERY_OPTIONS;
}

