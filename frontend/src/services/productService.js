/**
 * productService.js — Products, Categories & Wishlist service for ShilpSetu
 *
 * Connects to Supabase REST API and includes rich local handicraft fallbacks
 * to guarantee seamless rendering during onboarding or development.
 */

import { getCurrentUser, getAccessToken } from './auth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ── Local Fallback Data ───────────────────────────────────────

export const FALLBACK_CATEGORIES = [
  { id: 'cat-1', name: 'Pottery', slug: 'pottery', icon: 'pottery' },
  { id: 'cat-2', name: 'Textiles', slug: 'textiles', icon: 'textiles' },
  { id: 'cat-3', name: 'Jewellery', slug: 'jewellery', icon: 'jewellery' },
  { id: 'cat-4', name: 'Home Decor', slug: 'home-decor', icon: 'homedecor' },
  { id: 'cat-5', name: 'More', slug: 'more', icon: 'more' },
];

export const FALLBACK_COLLECTIONS = [
  {
    id: 'col-1',
    name: 'Woodcrafts',
    slug: 'woodcrafts',
    itemCount: '120+ Items',
    imageKey: 'woodcrafts',
  },
  {
    id: 'col-2',
    name: 'Handlooms',
    slug: 'handlooms',
    itemCount: '240+ Items',
    imageKey: 'handlooms',
  },
  {
    id: 'col-3',
    name: 'Accessories',
    slug: 'accessories',
    itemCount: '85+ Items',
    imageKey: 'accessories',
  },
];

export const FALLBACK_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Handcarved Rosewood Elephant',
    artisan_name: 'Master Rameshwar Rao',
    price: 2499,
    original_price: 2999,
    rating: 4.9,
    reviews_count: 128,
    category_name: 'Woodcrafts',
    imageKey: 'woodcrafts',
  },
  {
    id: 'prod-2',
    name: 'Chanderi Zari Silk Saree',
    artisan_name: 'Devi Handlooms Varanasi',
    price: 4850,
    original_price: 5999,
    rating: 4.8,
    reviews_count: 94,
    category_name: 'Handlooms',
    imageKey: 'handlooms',
  },
  {
    id: 'prod-3',
    name: 'Traditional Kundan Jhumkas',
    artisan_name: 'Kundan Heritage Jaipur',
    price: 1899,
    original_price: 2400,
    rating: 4.9,
    reviews_count: 215,
    category_name: 'Accessories',
    imageKey: 'accessories',
  },
  {
    id: 'prod-4',
    name: 'Terracotta Painted Matka Set',
    artisan_name: 'Kumhar Craft Collective',
    price: 1299,
    original_price: 1699,
    rating: 4.7,
    reviews_count: 76,
    category_name: 'Pottery',
    imageKey: 'pottery',
  },
  {
    id: 'prod-5',
    name: 'Brass Peacock Diya Pair',
    artisan_name: 'Swarna Shilp Thanjavur',
    price: 1650,
    original_price: 2100,
    rating: 4.9,
    reviews_count: 142,
    category_name: 'Home Decor',
    imageKey: 'woodcrafts',
  },
];

// In-memory wishlist cache
const localWishlist = new Set();

function authHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── Public Service Functions ──────────────────────────────────

/**
 * Fetch all categories
 */
export async function fetchCategories() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return FALLBACK_CATEGORIES;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?select=*&order=display_order.asc`,
      { headers: authHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Return fallback
  }

  return FALLBACK_CATEGORIES;
}

/**
 * Fetch featured products for the collection cards
 */
export async function fetchFeaturedCollections() {
  return FALLBACK_COLLECTIONS;
}

/**
 * Fetch curated products for the "Curated for You" section
 */
export async function fetchCuratedProducts() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return FALLBACK_PRODUCTS;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&is_curated=eq.true&is_active=eq.true&limit=10`,
      { headers: authHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p) => ({
          ...p,
          price: Number(p.price),
          original_price: p.original_price ? Number(p.original_price) : null,
          rating: Number(p.rating || 4.8),
          imageKey: p.category_name?.toLowerCase().includes('textile') || p.category_name?.toLowerCase().includes('loom')
            ? 'handlooms'
            : p.category_name?.toLowerCase().includes('jewel') || p.category_name?.toLowerCase().includes('access')
            ? 'accessories'
            : p.category_name?.toLowerCase().includes('pot')
            ? 'pottery'
            : 'woodcrafts',
        }));
      }
    }
  } catch {
    // Return fallback
  }

  return FALLBACK_PRODUCTS;
}

/**
 * Search products by keyword
 */
export async function searchProducts(keyword) {
  if (!keyword || !keyword.trim()) return fetchCuratedProducts();

  const term = keyword.trim().toLowerCase();

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/products?name=ilike.*${encodeURIComponent(term)}*&select=*`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Fall through to local filter
    }
  }

  return FALLBACK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.artisan_name.toLowerCase().includes(term) ||
      p.category_name?.toLowerCase().includes(term)
  );
}

/**
 * Fetch products filtered by category slug or name
 */
export async function fetchProductsByCategory(categoryName) {
  if (!categoryName || categoryName === 'More') return fetchCuratedProducts();

  const term = categoryName.toLowerCase();

  return FALLBACK_PRODUCTS.filter(
    (p) =>
      p.category_name?.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term)
  );
}

/**
 * Toggle a product in user's wishlist
 */
export async function toggleWishlist(productId) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  const isCurrentlyIn = localWishlist.has(productId);

  if (isCurrentlyIn) {
    localWishlist.delete(productId);
  } else {
    localWishlist.add(productId);
  }

  if (user && token && SUPABASE_URL) {
    try {
      if (isCurrentlyIn) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/wishlist?user_id=eq.${user.id}&product_id=eq.${productId}`,
          { method: 'DELETE', headers: authHeaders(token) }
        );
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/wishlist`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ user_id: user.id, product_id: productId }),
        });
      }
    } catch {
      // Ignore network sync issues for wishlist
    }
  }

  return !isCurrentlyIn;
}

/**
 * Check if a product is in wishlist
 */
export function isInWishlist(productId) {
  return localWishlist.has(productId);
}

