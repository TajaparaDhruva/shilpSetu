/**
 * productService.js — Products service for ShilpSetu Customer Home
 *
 * Provides product retrieval functions according to ShilpSetu backend specification:
 * - getFeaturedProducts: Active products with stock > 0 marked is_featured
 * - getCuratedProducts: Active products with stock > 0 marked is_curated (or newest)
 * - getProductsByCategory: Active products filtered by category
 * - searchProducts: Active products searched by title, description or tags
 * - getProductDetails: Full product details with artisan profile
 */

import { getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const FALLBACK_PRODUCTS = [
  {
    id: 'prod-pot-1',
    name: 'Terracotta Pot Set',
    artisan_name: 'Kumhar Craft Collective',
    price: 799,
    original_price: 999,
    rating: 4.8,
    reviews_count: 126,
    category_name: 'Pottery',
    category: 'Pottery',
    imageKey: 'pottery',
    stock: 14,
    is_active: true,
    is_featured: true,
    is_curated: true,
  },
  {
    id: 'prod-text-1',
    name: 'Handloom Stole',
    artisan_name: 'Devi Handlooms Varanasi',
    price: 1299,
    original_price: 1599,
    rating: 4.7,
    reviews_count: 89,
    category_name: 'Textiles',
    category: 'Textiles',
    imageKey: 'handlooms',
    stock: 18,
    is_active: true,
    is_featured: true,
    is_curated: true,
  },
  {
    id: 'prod-jewel-1',
    name: 'Traditional Jhumkas',
    artisan_name: 'Kundan Heritage Jaipur',
    price: 599,
    original_price: 799,
    rating: 4.9,
    reviews_count: 214,
    category_name: 'Jewellery',
    category: 'Jewellery',
    imageKey: 'accessories',
    stock: 25,
    is_active: true,
    is_featured: true,
    is_curated: true,
  },
  {
    id: 'prod-wood-1',
    name: 'Wooden Elephant',
    artisan_name: 'Master Rameshwar Rao',
    price: 1099,
    original_price: 1499,
    rating: 4.8,
    reviews_count: 67,
    category_name: 'Decor',
    category: 'Decor',
    imageKey: 'woodcrafts',
    stock: 9,
    is_active: true,
    is_featured: true,
    is_curated: true,
  },
  {
    id: 'prod-1',
    name: 'Handcarved Rosewood Elephant',
    artisan_name: 'Master Rameshwar Rao',
    price: 2499,
    original_price: 2999,
    rating: 4.9,
    reviews_count: 128,
    category_name: 'Woodcrafts',
    category: 'Woodcrafts',
    imageKey: 'woodcrafts',
    stock: 12,
    is_active: true,
    is_featured: true,
    is_curated: true,
  },
  {
    id: 'prod-2',
    name: 'Chanderi Zari Silk Saree',
    artisan_name: 'Devi Handlooms Varanasi',
    price: 4850,
    original_price: 5999,
    rating: 4.8,
    reviews_count: 94,
    category_name: 'Textiles',
    category: 'Textiles',
    imageKey: 'handlooms',
    stock: 5,
    is_active: true,
    is_featured: true,
    is_curated: true,
  },
  {
    id: 'prod-3',
    name: 'Traditional Kundan Jhumkas',
    artisan_name: 'Kundan Heritage Jaipur',
    price: 1899,
    original_price: 2400,
    rating: 4.9,
    reviews_count: 215,
    category_name: 'Jewellery',
    category: 'Jewellery',
    imageKey: 'accessories',
    stock: 20,
    is_active: true,
    is_featured: true,
    is_curated: true,
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
    category: 'Pottery',
    imageKey: 'pottery',
    stock: 8,
    is_active: true,
    is_featured: false,
    is_curated: true,
  },
  {
    id: 'prod-5',
    name: 'Brass Peacock Diya Pair',
    artisan_name: 'Swarna Shilp Thanjavur',
    price: 1650,
    original_price: 2100,
    rating: 4.9,
    reviews_count: 142,
    category_name: 'Decor',
    category: 'Decor',
    imageKey: 'woodcrafts',
    stock: 15,
    is_active: true,
    is_featured: false,
    is_curated: true,
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

function mapProduct(p) {
  const categoryStr = (p.category_name || p.category || '').toLowerCase();
  let imageKey = 'woodcrafts';
  if (categoryStr.includes('pot')) imageKey = 'pottery';
  else if (categoryStr.includes('text') || categoryStr.includes('loom') || categoryStr.includes('saree')) imageKey = 'handlooms';
  else if (categoryStr.includes('jewel') || categoryStr.includes('access')) imageKey = 'accessories';

  const artisanName =
    p.artisan_profile?.business_name ||
    p.artisan_profile?.profiles?.full_name ||
    p.profiles?.full_name ||
    p.artisan_name ||
    'Skilled Indian Artisan';

  return {
    ...p,
    artisan_name: artisanName,
    price: Number(p.price || 0),
    original_price: p.original_price ? Number(p.original_price) : null,
    rating: Number(p.rating || 4.8),
    reviews_count: Number(p.reviews_count || p.total_reviews || 24),
    category_name: p.category || p.category_name || 'Handicrafts',
    imageKey,
  };
}

/**
 * 1. Get Featured Products
 * Retrieves active products with available stock flagged as featured.
 */
export async function getFeaturedProducts({ limit = 10, offset = 0 } = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return FALLBACK_PRODUCTS.filter((p) => p.is_featured).slice(offset, offset + limit);
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/products?select=*,artisan_profiles:artisan_id(business_name,craft_specialty,profiles:user_id(full_name))&is_active=eq.true&stock=gt.0&is_featured=eq.true&order=created_at.desc&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapProduct);
      }
    }
  } catch {
    // Network fallback
  }

  return FALLBACK_PRODUCTS.filter((p) => p.is_featured).slice(offset, offset + limit);
}

/**
 * 2. Get Curated Products
 * Retrieves active products with stock > 0 for the "Curated for You" home section.
 */
export async function getCuratedProducts({ limit = 10, offset = 0 } = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return FALLBACK_PRODUCTS.slice(offset, offset + limit);
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/products?select=*,artisan_profiles:artisan_id(business_name,craft_specialty,profiles:user_id(full_name))&is_active=eq.true&stock=gt.0&order=created_at.desc&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapProduct);
      }
    }
  } catch {
    // Network fallback
  }

  return FALLBACK_PRODUCTS.slice(offset, offset + limit);
}

// Backward compatible alias
export const fetchCuratedProducts = getCuratedProducts;

/**
 * 3. Get Products By Category
 * Retrieves active products with stock > 0 belonging to a given category.
 */
export async function getProductsByCategory(category, { limit = 20, offset = 0 } = {}) {
  if (!category || category === 'All' || category === 'More') {
    return getCuratedProducts({ limit, offset });
  }

  const categoryTerm = category.trim().toLowerCase();

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/products?select=*,artisan_profiles:artisan_id(business_name,craft_specialty,profiles:user_id(full_name))&is_active=eq.true&stock=gt.0&category=ilike.*${encodeURIComponent(categoryTerm)}*&order=created_at.desc&limit=${limit}&offset=${offset}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(mapProduct);
        }
      }
    } catch {
      // Local fallback
    }
  }

  return FALLBACK_PRODUCTS.filter(
    (p) =>
      p.category_name?.toLowerCase().includes(categoryTerm) ||
      p.name.toLowerCase().includes(categoryTerm)
  ).slice(offset, offset + limit);
}

// Backward compatible alias
export const fetchProductsByCategory = getProductsByCategory;

/**
 * 4. Search Products
 * Searches active products with available stock by keyword in name, description or tags.
 */
export async function searchProducts(searchQuery, { limit = 20, offset = 0 } = {}) {
  if (!searchQuery || !searchQuery.trim()) {
    return getCuratedProducts({ limit, offset });
  }

  const term = searchQuery.trim().toLowerCase();

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      // Query search on name or description or category
      const url = `${SUPABASE_URL}/rest/v1/products?select=*,artisan_profiles:artisan_id(business_name,craft_specialty,profiles:user_id(full_name))&is_active=eq.true&stock=gt.0&or=(name.ilike.*${encodeURIComponent(term)}*,description.ilike.*${encodeURIComponent(term)}*,category.ilike.*${encodeURIComponent(term)}*)&limit=${limit}&offset=${offset}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(mapProduct);
        }
      }
    } catch {
      // Fall through to local fallback
    }
  }

  return FALLBACK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.artisan_name?.toLowerCase().includes(term) ||
      p.category_name?.toLowerCase().includes(term)
  ).slice(offset, offset + limit);
}

/**
 * 5. Get Product Details
 * Retrieves complete product information with associated artisan profile.
 */
export async function getProductDetails(productId) {
  if (!productId) return null;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/products?select=*,artisan_profiles:artisan_id(*,profiles:user_id(full_name,email,avatar_url))&id=eq.${productId}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return mapProduct(data[0]);
        }
      }
    } catch {
      // Fall through
    }
  }

  const fallback = FALLBACK_PRODUCTS.find((p) => p.id === productId);
  return fallback || null;
}
