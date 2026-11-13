/**
 * productService.js — Products service for ShilpSetu
 *
 * Provides product search, category filtering, advanced faceted filters,
 * rating calculation, and full product details.
 */

import { getAccessToken } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const FALLBACK_PRODUCTS = [
  {
    id: 'prod-pot-1',
    name: 'Terracotta Pot Set',
    description: 'Handmade rustic earthen terracotta clay pots for decoration or kitchen use.',
    artisan_name: 'Kumhar Craft Collective',
    price: 799,
    original_price: 999,
    rating: 4.8,
    reviews_count: 126,
    category_name: 'Pottery',
    category: 'Pottery',
    tags: ['terracotta', 'pottery', 'clay', 'earthen', 'handmade'],
    imageKey: 'pottery',
    stock: 14,
    is_active: true,
    is_featured: true,
    is_curated: true,
    created_at: '2026-11-10T10:00:00Z',
  },
  {
    id: 'prod-text-1',
    name: 'Handloom Stole',
    description: 'Pure heritage woven wool and silk stole with traditional Indian patterns.',
    artisan_name: 'Devi Handlooms Varanasi',
    price: 1299,
    original_price: 1599,
    rating: 4.7,
    reviews_count: 89,
    category_name: 'Textiles',
    category: 'Textiles',
    tags: ['textiles', 'handloom', 'stole', 'silk', 'scarf'],
    imageKey: 'handlooms',
    stock: 18,
    is_active: true,
    is_featured: true,
    is_curated: true,
    created_at: '2026-11-11T12:00:00Z',
  },
  {
    id: 'prod-jewel-1',
    name: 'Traditional Jhumkas',
    description: 'Ethnic gold-plated antique Kundan bell earrings with pearl droplet finish.',
    artisan_name: 'Kundan Heritage Jaipur',
    price: 599,
    original_price: 799,
    rating: 4.9,
    reviews_count: 214,
    category_name: 'Jewellery',
    category: 'Jewellery',
    tags: ['jewellery', 'jhumkas', 'earrings', 'kundan', 'gold'],
    imageKey: 'accessories',
    stock: 25,
    is_active: true,
    is_featured: true,
    is_curated: true,
    created_at: '2026-11-12T08:00:00Z',
  },
  {
    id: 'prod-wood-1',
    name: 'Wooden Elephant',
    description: 'Intricately handcarved rosewood miniature elephant idol figurine.',
    artisan_name: 'Master Rameshwar Rao',
    price: 1099,
    original_price: 1499,
    rating: 4.8,
    reviews_count: 67,
    category_name: 'Decor',
    category: 'Decor',
    tags: ['decor', 'woodcrafts', 'elephant', 'rosewood', 'handcarved'],
    imageKey: 'woodcrafts',
    stock: 9,
    is_active: true,
    is_featured: true,
    is_curated: true,
    created_at: '2026-11-13T09:00:00Z',
  },
  {
    id: 'prod-1',
    name: 'Handcarved Rosewood Elephant',
    description: 'Master artisan crafted traditional royal rosewood elephant statue.',
    artisan_name: 'Master Rameshwar Rao',
    price: 2499,
    original_price: 2999,
    rating: 4.9,
    reviews_count: 128,
    category_name: 'Woodcrafts',
    category: 'Woodcrafts',
    tags: ['woodcrafts', 'rosewood', 'statue', 'sculpture'],
    imageKey: 'woodcrafts',
    stock: 12,
    is_active: true,
    is_featured: true,
    is_curated: true,
    created_at: '2026-11-08T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Chanderi Zari Silk Saree',
    description: 'Authentic royal Chanderi pure silk saree woven with golden zari borders.',
    artisan_name: 'Devi Handlooms Varanasi',
    price: 4850,
    original_price: 5999,
    rating: 4.8,
    reviews_count: 94,
    category_name: 'Textiles',
    category: 'Textiles',
    tags: ['textiles', 'handloom', 'saree', 'silk', 'chanderi'],
    imageKey: 'handlooms',
    stock: 5,
    is_active: true,
    is_featured: true,
    is_curated: true,
    created_at: '2026-11-09T14:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Traditional Kundan Jhumkas',
    description: 'Heritage ethnic Kundan earrings with hand-set gemstones.',
    artisan_name: 'Kundan Heritage Jaipur',
    price: 1899,
    original_price: 2400,
    rating: 4.9,
    reviews_count: 215,
    category_name: 'Jewellery',
    category: 'Jewellery',
    tags: ['jewellery', 'kundan', 'earrings', 'jaipur'],
    imageKey: 'accessories',
    stock: 20,
    is_active: true,
    is_featured: true,
    is_curated: true,
    created_at: '2026-11-07T11:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Terracotta Painted Matka Set',
    description: 'Pair of handcrafted terracotta water matkas painted with tribal motifs.',
    artisan_name: 'Kumhar Craft Collective',
    price: 1299,
    original_price: 1699,
    rating: 4.7,
    reviews_count: 76,
    category_name: 'Pottery',
    category: 'Pottery',
    tags: ['pottery', 'terracotta', 'matka', 'tribal'],
    imageKey: 'pottery',
    stock: 8,
    is_active: true,
    is_featured: false,
    is_curated: true,
    created_at: '2026-11-05T09:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'Brass Peacock Diya Pair',
    description: 'Pair of brass hanging peacock oil lamps for festive home decor.',
    artisan_name: 'Swarna Shilp Thanjavur',
    price: 1650,
    original_price: 2100,
    rating: 4.9,
    reviews_count: 142,
    category_name: 'Decor',
    category: 'Decor',
    tags: ['decor', 'brass', 'diya', 'lamp', 'thanjavur'],
    imageKey: 'woodcrafts',
    stock: 15,
    is_active: true,
    is_featured: false,
    is_curated: true,
    created_at: '2026-11-06T15:00:00Z',
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
  else if (categoryStr.includes('text') || categoryStr.includes('loom') || categoryStr.includes('saree') || categoryStr.includes('stole')) imageKey = 'handlooms';
  else if (categoryStr.includes('jewel') || categoryStr.includes('access')) imageKey = 'accessories';

  const artisanName =
    p.artisan_name ||
    p.artisan_business_name ||
    p.artisan_profiles?.business_name ||
    p.artisan_profiles?.profiles?.full_name ||
    p.profiles?.full_name ||
    'Skilled Indian Artisan';

  return {
    ...p,
    artisan_name: artisanName,
    price: Number(p.price || 0),
    original_price: p.original_price ? Number(p.original_price) : null,
    rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : null,
    reviews_count: Number(p.reviews_count || 0),
    category_name: p.category_name || p.category || 'Handicrafts',
    imageKey,
  };
}

/**
 * Filter & Sort helper on in-memory array (used when offline or for local fallback)
 */
function applyLocalFiltersAndSort(products, { query, category, filters = {}, sort = 'popular', page = 1, limit = 20 } = {}) {
  let list = [...products];

  // Only active products
  list = list.filter((p) => p.is_active === true);

  // In-stock filtering
  if (filters.inStockOnly !== false) {
    list = list.filter((p) => (p.stock === undefined || p.stock > 0));
  }

  // Text search (name, description, artisan, category, tags)
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter((p) => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchArtisan = p.artisan_name?.toLowerCase().includes(q);
      const matchCat = (p.category_name || p.category || '').toLowerCase().includes(q);
      const matchTags = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchArtisan || matchCat || matchTags;
    });
  }

  // Category filter
  if (category && category.toLowerCase() !== 'all') {
    const cat = category.toLowerCase().trim();
    list = list.filter((p) => {
      const pCat = (p.category_name || p.category || '').toLowerCase();
      return pCat.includes(cat);
    });
  }

  // Min price
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    list = list.filter((p) => p.price >= Number(filters.minPrice));
  }

  // Max price
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    list = list.filter((p) => p.price <= Number(filters.maxPrice));
  }

  // Min rating
  if (filters.minRating !== null && filters.minRating !== undefined) {
    list = list.filter((p) => (p.rating || 0) >= Number(filters.minRating));
  }

  // Sorting
  switch (sort) {
    case 'newest':
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      break;
    case 'price_low_high':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price_high_low':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'highest_rated':
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'popular':
    default:
      list.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
      break;
  }

  const offset = (page - 1) * limit;
  return list.slice(offset, offset + limit).map(mapProduct);
}

/**
 * 1. searchProducts(query, filters, sort, page)
 * Full search across name, description, artisan, category, tags with filters and sorting
 */
export async function searchProducts(query, filters = {}, sort = 'popular', page = 1, limit = 20) {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const offset = (page - 1) * limit;
      // 1. Try search_and_filter_products RPC
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_and_filter_products`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          p_query: query || null,
          p_category: filters.category || null,
          p_min_price: filters.minPrice || null,
          p_max_price: filters.maxPrice || null,
          p_in_stock_only: filters.inStockOnly !== undefined ? filters.inStockOnly : true,
          p_min_rating: filters.minRating || null,
          p_sort_by: sort || 'popular',
          p_limit: limit,
          p_offset: offset,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map(mapProduct);
        }
      }
    } catch {
      // Fall through to local fallback
    }
  }

  return applyLocalFiltersAndSort(FALLBACK_PRODUCTS, {
    query,
    category: filters.category,
    filters,
    sort,
    page,
    limit,
  });
}

/**
 * 2. getProductsByCategory(category, filters, sort, page)
 * Retrieve active in-stock products for a specific category
 */
export async function getProductsByCategory(category, filters = {}, sort = 'popular', page = 1, limit = 20) {
  const mergedFilters = {
    ...filters,
    category: category === 'all' || category === 'All' ? null : category,
  };
  return searchProducts(null, mergedFilters, sort, page, limit);
}

/**
 * 3. getExploreProducts(filters, sort, page)
 * General multi-faceted explore endpoint
 */
export async function getExploreProducts(filters = {}, sort = 'popular', page = 1, limit = 20) {
  return searchProducts(null, filters, sort, page, limit);
}

/**
 * 4. getProductRating(productId)
 * Calculate average rating and total review count from product_ratings_view or reviews table
 */
export async function getProductRating(productId) {
  if (!productId) return { rating: null, reviews_count: 0 };

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/product_ratings_view?product_id=eq.${productId}&select=*`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return {
            rating: data[0].avg_rating !== null ? Number(data[0].avg_rating) : null,
            reviews_count: Number(data[0].total_reviews || 0),
          };
        }
      }
    } catch {
      // Fall through
    }
  }

  const p = FALLBACK_PRODUCTS.find((item) => item.id === productId);
  return {
    rating: p ? p.rating : null,
    reviews_count: p ? p.reviews_count : 0,
  };
}

/**
 * 5. getFeaturedProducts
 */
export async function getFeaturedProducts({ limit = 10, offset = 0 } = {}) {
  const page = Math.floor(offset / limit) + 1;
  return searchProducts(null, { inStockOnly: true }, 'popular', page, limit);
}

/**
 * 6. getCuratedProducts
 */
export async function getCuratedProducts({ limit = 20, offset = 0 } = {}) {
  const page = Math.floor(offset / limit) + 1;
  return searchProducts(null, { inStockOnly: true }, 'newest', page, limit);
}

export const fetchCuratedProducts = getCuratedProducts;
export const fetchProductsByCategory = getProductsByCategory;

/**
 * 7. getProductDetails(productId)
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
          const ratingData = await getProductRating(productId);
          return mapProduct({ ...data[0], ...ratingData });
        }
      }
    } catch {
      // Fall through
    }
  }

  const fallback = FALLBACK_PRODUCTS.find((p) => p.id === productId);
  return fallback ? mapProduct(fallback) : null;
}
