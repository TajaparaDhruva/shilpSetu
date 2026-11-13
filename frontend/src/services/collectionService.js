/**
 * collectionService.js — Featured Collections Service for ShilpSetu
 */

import { getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const DEFAULT_COLLECTIONS = [
  {
    id: 'col-woodcrafts',
    name: 'Woodcrafts',
    slug: 'woodcrafts',
    description: 'Authentic handcarved wooden statues and utility art',
    itemCount: '120+ Items',
    imageKey: 'woodcrafts',
    display_order: 1,
  },
  {
    id: 'col-handlooms',
    name: 'Handlooms',
    slug: 'handlooms',
    description: 'Traditional weave sarees and heirloom textiles',
    itemCount: '240+ Items',
    imageKey: 'handlooms',
    display_order: 2,
  },
  {
    id: 'col-accessories',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Heritage ethnic jewellery and handmade ornaments',
    itemCount: '85+ Items',
    imageKey: 'accessories',
    display_order: 3,
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
 * Fetch all active featured collections ordered by display_order
 */
export async function getFeaturedCollections() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return DEFAULT_COLLECTIONS;
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/collections?is_active=eq.true&select=id,name,slug,description,image_url,display_order&order=display_order.asc`,
      { headers: authHeaders() }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((c) => ({
          ...c,
          imageKey: c.slug || 'woodcrafts',
          itemCount: '100+ Items',
        }));
      }
    }
  } catch {
    // Network or schema fallback
  }

  return DEFAULT_COLLECTIONS;
}

/**
 * Fetch products associated with a specific collection
 * @param {string} collectionId 
 */
export async function getCollectionProducts(collectionId) {
  if (!collectionId) return [];

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return [];
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/collection_products?collection_id=eq.${collectionId}&select=product_id,display_order,products(*)&order=display_order.asc`,
      { headers: authHeaders() }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data
          .map((item) => item.products)
          .filter((prod) => prod && prod.is_active && prod.stock > 0);
      }
    }
  } catch {
    // Ignore and return empty array
  }

  return [];
}
