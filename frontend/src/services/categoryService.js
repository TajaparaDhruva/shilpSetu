/**
 * categoryService.js — Category Retrieval Service for ShilpSetu
 */

import { getAccessToken } from './auth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const DEFAULT_CATEGORIES = [
  { id: 'cat-pottery', name: 'Pottery', slug: 'pottery', icon_name: 'pottery', display_order: 1 },
  { id: 'cat-textiles', name: 'Textiles', slug: 'textiles', icon_name: 'textiles', display_order: 2 },
  { id: 'cat-jewellery', name: 'Jewellery', slug: 'jewellery', icon_name: 'jewellery', display_order: 3 },
  { id: 'cat-homedecor', name: 'Home Decor', slug: 'home-decor', icon_name: 'homedecor', display_order: 4 },
  { id: 'cat-woodcrafts', name: 'Woodcrafts', slug: 'woodcrafts', icon_name: 'woodcrafts', display_order: 5 },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', icon_name: 'accessories', display_order: 6 },
  { id: 'cat-more', name: 'More', slug: 'more', icon_name: 'more', display_order: 7 },
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
 * Fetch all active categories ordered by display_order
 */
export async function getCategories() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return DEFAULT_CATEGORIES;
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?is_active=eq.true&select=id,name,slug,icon_name,image_url,display_order&order=display_order.asc`,
      { headers: authHeaders() }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // Network or schema fallback
  }

  return DEFAULT_CATEGORIES;
}

