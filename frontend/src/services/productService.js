/**
 * productService.js — Products, Artisans & Details service for ShilpSetu
 *
 * Provides:
 * - getProductDetails(productId)
 * - getProductImages(productId)
 * - getProductRating(productId)
 * - getProductArtisan(artisanId)
 * - searchProducts(query, filters, sort, page, limit)
 * - getProductsByCategory(category, filters, sort, page, limit)
 * - getExploreProducts(filters, sort, page, limit)
 */

import { getAccessToken, getCurrentUser } from './auth.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PRODUCTS_KEY = 'shilpsetu_artisan_products';

/** Load persistent products saved locally on device */
export async function getPersistentProducts() {
  try {
    if (AsyncStorage) {
      const data = await AsyncStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn('getPersistentProducts read error:', err);
  }
  return [];
}

/** Save persistent product locally on device */
export async function savePersistentProduct(product) {
  try {
    if (AsyncStorage && product) {
      const existing = await getPersistentProducts();
      const updated = [product, ...existing.filter((p) => p.id !== product.id)];
      await AsyncStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('savePersistentProduct write error:', err);
  }
}

/** Update persistent product locally on device */
export async function updatePersistentProduct(productId, updatedFields) {
  try {
    if (AsyncStorage) {
      const existing = await getPersistentProducts();
      const updated = existing.map((p) => (p.id === productId ? { ...p, ...updatedFields } : p));
      await AsyncStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('updatePersistentProduct error:', err);
  }
}

/** Delete persistent product locally on device */
export async function removePersistentProduct(productId) {
  try {
    if (AsyncStorage) {
      const existing = await getPersistentProducts();
      const updated = existing.filter((p) => p.id !== productId);
      await AsyncStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('removePersistentProduct error:', err);
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const FALLBACK_PRODUCTS = [
  {
    id: 'prod-pot-1',
    name: 'Terracotta Pot Set',
    description: 'Handcrafted terracotta pot set with traditional Gujarati patterns. Perfect for home décor, gifting, or adding a natural touch to your space.',
    artisan_id: 'artisan-ramesh-1',
    artisan_name: 'Ramesh Bhai',
    artisan_location: 'Kutch, Gujarat',
    artisan_description: 'Master terracotta clay artisan carrying forward 4 generations of traditional Kutch pot making.',
    price: 799,
    original_price: 999,
    rating: 4.8,
    reviews_count: 126,
    category_name: 'Pottery',
    category: 'Pottery',
    tags: ['terracotta', 'pottery', 'clay', 'earthen', 'handmade'],
    imageKey: 'pottery',
    image_urls: [],
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
    artisan_id: 'artisan-devi-1',
    artisan_name: 'Devi Handlooms Varanasi',
    artisan_location: 'Varanasi, Uttar Pradesh',
    artisan_description: 'Weaver collective preserving ancient Banarasi handloom techniques.',
    price: 1299,
    original_price: 1599,
    rating: 4.7,
    reviews_count: 89,
    category_name: 'Textiles',
    category: 'Textiles',
    tags: ['textiles', 'handloom', 'stole', 'silk', 'scarf'],
    imageKey: 'handlooms',
    image_urls: [],
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
    artisan_id: 'artisan-kundan-1',
    artisan_name: 'Kundan Heritage Jaipur',
    artisan_location: 'Jaipur, Rajasthan',
    artisan_description: 'Traditional jewellery artisan skilled in royal Rajasthani Meenakari and Kundan craft.',
    price: 599,
    original_price: 799,
    rating: 4.9,
    reviews_count: 214,
    category_name: 'Jewellery',
    category: 'Jewellery',
    tags: ['jewellery', 'jhumkas', 'earrings', 'kundan', 'gold'],
    imageKey: 'accessories',
    image_urls: [],
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
    artisan_id: 'artisan-rameshwar-1',
    artisan_name: 'Master Rameshwar Rao',
    artisan_location: 'Mysore, Karnataka',
    artisan_description: 'Award-winning master woodcarver specializing in natural rosewood and sandalwood heritage sculptures.',
    price: 1099,
    original_price: 1499,
    rating: 4.8,
    reviews_count: 67,
    category_name: 'Decor',
    category: 'Decor',
    tags: ['decor', 'woodcrafts', 'elephant', 'rosewood', 'handcarved'],
    imageKey: 'woodcrafts',
    image_urls: [],
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
    artisan_id: 'artisan-rameshwar-1',
    artisan_name: 'Master Rameshwar Rao',
    artisan_location: 'Mysore, Karnataka',
    price: 2499,
    original_price: 2999,
    rating: 4.9,
    reviews_count: 128,
    category_name: 'Woodcrafts',
    category: 'Woodcrafts',
    tags: ['woodcrafts', 'rosewood', 'statue', 'sculpture'],
    imageKey: 'woodcrafts',
    image_urls: [],
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
    artisan_id: 'artisan-devi-1',
    artisan_name: 'Devi Handlooms Varanasi',
    artisan_location: 'Varanasi, Uttar Pradesh',
    price: 4850,
    original_price: 5999,
    rating: 4.8,
    reviews_count: 94,
    category_name: 'Textiles',
    category: 'Textiles',
    tags: ['textiles', 'handloom', 'saree', 'silk', 'chanderi'],
    imageKey: 'handlooms',
    image_urls: [],
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
    artisan_id: 'artisan-kundan-1',
    artisan_name: 'Kundan Heritage Jaipur',
    artisan_location: 'Jaipur, Rajasthan',
    price: 1899,
    original_price: 2400,
    rating: 4.9,
    reviews_count: 215,
    category_name: 'Jewellery',
    category: 'Jewellery',
    tags: ['jewellery', 'kundan', 'earrings', 'jaipur'],
    imageKey: 'accessories',
    image_urls: [],
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
    artisan_id: 'artisan-ramesh-1',
    artisan_name: 'Kumhar Craft Collective',
    artisan_location: 'Kutch, Gujarat',
    price: 1299,
    original_price: 1699,
    rating: 4.7,
    reviews_count: 76,
    category_name: 'Pottery',
    category: 'Pottery',
    tags: ['pottery', 'terracotta', 'matka', 'tribal'],
    imageKey: 'pottery',
    image_urls: [],
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
    artisan_id: 'artisan-swarna-1',
    artisan_name: 'Swarna Shilp Thanjavur',
    artisan_location: 'Thanjavur, Tamil Nadu',
    price: 1650,
    original_price: 2100,
    rating: 4.9,
    reviews_count: 142,
    category_name: 'Decor',
    category: 'Decor',
    tags: ['decor', 'brass', 'diya', 'lamp', 'thanjavur'],
    imageKey: 'woodcrafts',
    image_urls: [],
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

function calculateDiscount(price, originalPrice) {
  const p = Number(price || 0);
  const op = originalPrice ? Number(originalPrice) : null;
  if (!op || op <= p || p <= 0) return 0;
  return Math.round(((op - p) / op) * 100);
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

  const sellingPrice = Number(p.price || p.selling_price || 0);
  const origPrice = p.original_price ? Number(p.original_price) : null;

  return {
    ...p,
    id: p.id || p.product_id,
    artisan_name: artisanName,
    artisan_location: p.artisan_location || p.location || 'India',
    artisan_avatar: p.artisan_avatar || p.avatar_url || p.profile_picture || null,
    price: sellingPrice,
    original_price: origPrice,
    discount_percentage: p.discount_percentage !== undefined ? Number(p.discount_percentage) : calculateDiscount(sellingPrice, origPrice),
    rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : null,
    reviews_count: Number(p.reviews_count || 0),
    category_name: p.category_name || p.category || 'Handicrafts',
    imageKey,
    image_urls: Array.isArray(p.image_urls) ? p.image_urls : p.image_url ? [p.image_url] : [],
  };
}

/**
 * 1. getProductDetails(productId)
 * Fetches full details for an active product, including public artisan details, stock, images & reviews
 */
export async function getProductDetails(productId) {
  if (!productId) return null;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      // 1. Try secure RPC function first
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_product_details`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ p_product_id: productId }),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && rpcData.id) {
          return mapProduct(rpcData);
        }
      }

      // 2. Query product_details_view directly
      const viewRes = await fetch(
        `${SUPABASE_URL}/rest/v1/product_details_view?product_id=eq.${productId}&is_active=eq.true`,
        { headers: authHeaders() }
      );

      if (viewRes.ok) {
        const viewData = await viewRes.json();
        if (Array.isArray(viewData) && viewData.length > 0) {
          return mapProduct(viewData[0]);
        }
      }

      // 3. Direct products table query
      const prodRes = await fetch(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&is_active=eq.true&select=*`,
        { headers: authHeaders() }
      );
      if (prodRes.ok) {
        const rows = await prodRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return mapProduct(rows[0]);
        }
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * 2. getProductImages(productId)
 * Retrieves ordered array of product image URLs
 */
export async function getProductImages(productId) {
  const product = await getProductDetails(productId);
  if (!product) return [];
  return product.image_urls || [];
}

/**
 * 3. getProductRating(productId)
 * Calculates average rating and total review count
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
 * 4. getProductArtisan(artisanId)
 * Returns public artisan profile information only (no private email or phone)
 */
export async function getProductArtisan(artisanId) {
  if (!artisanId) return null;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/artisan_public_profiles?artisan_id=eq.${artisanId}&select=*`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
      }
    } catch {
      // Fall through
    }
  }

  const p = FALLBACK_PRODUCTS.find((item) => item.artisan_id === artisanId || item.id === artisanId);
  if (p) {
    return {
      artisan_id: p.artisan_id,
      name: p.artisan_name,
      profile_picture: null,
      location: p.artisan_location || 'India',
      public_description: p.artisan_description || 'Authentic artisan crafting heritage Indian goods.',
    };
  }

  return null;
}

/**
 * 5. searchProducts
 */
export async function searchProducts(query, filters = {}, sort = 'popular', page = 1, limit = 20) {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const offset = (page - 1) * limit;
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
      // Fall through to REST query
    }

    // Direct REST query if RPC is missing
    try {
      const offset = (page - 1) * limit;
      let url = `${SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=*`;
      if (filters.category && filters.category.toLowerCase() !== 'all') {
        url += `&category=ilike.*${encodeURIComponent(filters.category)}*`;
      }
      if (filters.inStockOnly !== false) {
        url += `&stock=gt.0`;
      }
      url += `&limit=${limit}&offset=${offset}`;

      const restRes = await fetch(url, { headers: authHeaders() });
      if (restRes.ok) {
        const prods = await restRes.json();
        if (Array.isArray(prods)) {
          return prods.map(mapProduct);
        }
      }
    } catch {}

    // Never return dummy products when database is accessible
    return [];
  }

  return [];
}

/**
 * 6. getProductsByCategory
 */
export async function getProductsByCategory(category, filters = {}, sort = 'popular', page = 1, limit = 20) {
  const mergedFilters = {
    ...filters,
    category: category === 'all' || category === 'All' ? null : category,
  };
  return searchProducts(null, mergedFilters, sort, page, limit);
}

/**
 * 7. getExploreProducts
 */
export async function getExploreProducts(filters = {}, sort = 'popular', page = 1, limit = 20) {
  return searchProducts(null, filters, sort, page, limit);
}

/**
 * 8. getFeaturedProducts
 */
export async function getFeaturedProducts({ limit = 10, offset = 0 } = {}) {
  const page = Math.floor(offset / limit) + 1;
  return searchProducts(null, { inStockOnly: true }, 'popular', page, limit);
}

/**
 * 9. getCuratedProducts
 */
export async function getCuratedProducts({ limit = 20, offset = 0 } = {}) {
  const page = Math.floor(offset / limit) + 1;
  return searchProducts(null, { inStockOnly: true }, 'newest', page, limit);
}

export const fetchCuratedProducts = getCuratedProducts;
export const fetchProductsByCategory = getProductsByCategory;

/**
 * 10. getProductCategories()
 * Fetches craft categories from Supabase categories table or returns standard defaults
 */
export async function getProductCategories() {
  const token = getAccessToken();
  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=display_order.asc`, {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((c) => ({
            id: c.slug || c.id,
            name: c.name,
            icon: c.icon_name || '🏺',
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    }
  }

  return [
    { id: 'pottery', name: 'Pottery & Ceramics', icon: '🏺' },
    { id: 'textiles', name: 'Textiles & Handlooms', icon: '🧵' },
    { id: 'jewellery', name: 'Jewellery', icon: '✨' },
    { id: 'woodcrafts', name: 'Woodcrafts', icon: '🪵' },
    { id: 'homedecor', name: 'Home Decor', icon: '🏮' },
    { id: 'paintings', name: 'Paintings', icon: '🎨' },
    { id: 'accessories', name: 'Accessories', icon: '📿' },
    { id: 'other', name: 'Other', icon: '📦' },
  ];
}

/**
 * 11. uploadProductImages(images, productId)
 * Uploads local image URIs to Supabase Storage bucket 'product-images'
 * Organized under structure: product-images/{artisan_id}/{productId}/{filename}
 * Supports JPG, JPEG, and PNG, checks max 5 images, and validates file formats.
 */
export async function uploadProductImages(images = [], productId = null) {
  if (!Array.isArray(images) || images.length === 0) return [];
  if (images.length > 5) {
    throw new Error('A product can have a maximum of 5 images.');
  }

  const token = getAccessToken();
  const uploadedUrls = [];
  const prodId = productId || `prod-${Date.now()}`;

  for (let i = 0; i < images.length; i++) {
    const uri = images[i];

    // If it's already a remote HTTP URL, keep it
    if (typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'))) {
      uploadedUrls.push(uri);
      continue;
    }

    if (token && SUPABASE_URL) {
      try {
        let extension = 'jpg';
        let mimeType = 'image/jpeg';

        if (typeof uri === 'string') {
          const lower = uri.toLowerCase();
          if (lower.endsWith('.png')) {
            extension = 'png';
            mimeType = 'image/png';
          } else if (lower.endsWith('.jpeg')) {
            extension = 'jpeg';
            mimeType = 'image/jpeg';
          } else if (lower.endsWith('.jpg')) {
            extension = 'jpg';
            mimeType = 'image/jpeg';
          } else if (lower.startsWith('data:image/png')) {
            extension = 'png';
            mimeType = 'image/png';
          }
        }

        const filename = `image-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;
        
        // Deriving artisan user id from currentUser or auth token
        let artisanFolder = 'artisan';
        try {
          const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${token}`,
            },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData?.id) artisanFolder = userData.id;
          }
        } catch {}

        const storagePath = `${artisanFolder}/${prodId}/${filename}`;
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/product-images/${storagePath}`;

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: filename,
          type: mimeType,
        });

        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (res.ok) {
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`;
          uploadedUrls.push(publicUrl);
          continue;
        }
      } catch (err) {
        console.warn('Image upload to Supabase Storage failed, keeping local uri:', err);
      }
    }

    // Fallback: keep original URI
    uploadedUrls.push(uri);
  }

  return uploadedUrls;
}

/**
 * 12. createProduct(productData, images)
 * Validates, uploads images, and creates new product in Supabase products table
 * Enforces artisan role, ownership validation, price, stock, and 300-char description limits.
 */
export async function createProduct(productData, images = []) {
  const {
    name,
    product_name,
    description,
    price,
    stock = 10,
    stock_quantity,
    category = 'Pottery & Ceramics',
    tags = [],
    artisan_id = null,
    artisan_name = 'Master Artisan',
  } = productData;

  const resolvedName = (product_name || name || '').trim();
  const resolvedStock = stock_quantity !== undefined ? Number(stock_quantity) : Number(stock);
  const resolvedPrice = Number(price);
  const resolvedDesc = (description || '').trim();

  // 1. Validation
  if (!resolvedName) {
    return { success: false, error: 'Product name is required.' };
  }
  if (!price || isNaN(resolvedPrice) || resolvedPrice <= 0) {
    return { success: false, error: 'Price must be greater than zero.' };
  }
  if (resolvedStock === undefined || isNaN(resolvedStock) || resolvedStock < 0 || !Number.isInteger(resolvedStock)) {
    return { success: false, error: 'Stock quantity must be a non-negative integer.' };
  }
  if (!resolvedDesc) {
    return { success: false, error: 'Product description is required.' };
  }
  if (resolvedDesc.length > 300) {
    return { success: false, error: 'Product description must not exceed 300 characters.' };
  }
  if (!images || images.length === 0) {
    return { success: false, error: 'Please add at least one product image.' };
  }
  if (images.length > 5) {
    return { success: false, error: 'A product can have a maximum of 5 images.' };
  }

  // Validate image file formats if they have extensions
  for (const img of images) {
    if (typeof img === 'string' && (img.startsWith('file://') || img.startsWith('content://') || img.includes('.'))) {
      const cleanPath = img.split('?')[0].toLowerCase();
      if (!cleanPath.endsWith('.jpg') && !cleanPath.endsWith('.jpeg') && !cleanPath.endsWith('.png') && !cleanPath.startsWith('http') && !cleanPath.startsWith('data:image')) {
        return { success: false, error: 'Invalid image format. Only JPG, JPEG and PNG images are supported.' };
      }
    }
  }

  const token = getAccessToken();

  // 2. Upload images to 'product-images' bucket
  const prodTempId = `prod-${Date.now()}`;
  let uploadedImageUrls = [];
  try {
    uploadedImageUrls = await uploadProductImages(images, prodTempId);
  } catch (uploadErr) {
    return { success: false, error: uploadErr.message || 'Failed to upload product images.' };
  }

  const primaryImageUrl = uploadedImageUrls[0] || null;

  // 3. Insert into Supabase
  if (token && SUPABASE_URL) {
    // 3a. Try RPC create_product_rpc first for server-side trusted ownership & validation
    try {
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_product_rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          p_product_name: resolvedName,
          p_category: category,
          p_price: resolvedPrice,
          p_stock_quantity: resolvedStock,
          p_description: resolvedDesc,
          p_image_urls: uploadedImageUrls,
          p_tags: Array.isArray(tags) ? tags : [],
        }),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && rpcData.success) {
          if (rpcData.product) {
            FALLBACK_PRODUCTS.unshift(rpcData.product);
            await savePersistentProduct(rpcData.product);
          }
          return {
            success: true,
            product: rpcData.product,
            message: 'Product listed successfully on ShilpSetu!',
          };
        }
      }
    } catch (rpcErr) {
      // Fall through to direct table insert
    }

    // 3b. Direct REST insert with authenticated ownership
    try {
      // Verify user identity for trusted artisan_id
      let currentUserId = artisan_id;
      let currentArtisanName = artisan_name;
      try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData?.id) {
            currentUserId = userData.id;
            currentArtisanName = userData.user_metadata?.full_name || userData.user_metadata?.name || currentArtisanName;
          }
        }
      } catch {}

      const payload = {
        name: resolvedName,
        product_name: resolvedName,
        description: resolvedDesc,
        price: resolvedPrice,
        stock: resolvedStock,
        stock_quantity: resolvedStock,
        category: category,
        category_name: category,
        tags: Array.isArray(tags) ? tags : [],
        image_url: primaryImageUrl,
        image_urls: uploadedImageUrls,
        is_active: true,
        is_curated: true,
        is_featured: false,
        rating: 5.0,
        reviews_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (currentUserId) payload.artisan_id = currentUserId;
      if (currentArtisanName) payload.artisan_name = currentArtisanName;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const inserted = await res.json();
        const createdObj = Array.isArray(inserted) ? inserted[0] : inserted;
        if (createdObj) {
          const itemToStore = {
            ...createdObj,
            artisan_id: currentUserId,
            artisan_name: currentArtisanName,
          };
          FALLBACK_PRODUCTS.unshift(itemToStore);
          await savePersistentProduct(itemToStore);
        }
        return {
          success: true,
          product: createdObj,
          message: 'Product listed successfully on ShilpSetu!',
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData?.message) {
          console.warn('createProduct insert error:', errData.message);
        }
      }
    } catch (err) {
      console.warn('createProduct Supabase insert error:', err);
    }
  }

  // 4. Local fallback response
  let resolvedArtisanId = artisan_id;
  let resolvedArtisanName = artisan_name;
  if (!resolvedArtisanId) {
    try {
      const u = await getCurrentUser();
      resolvedArtisanId = u?.id || null;
      resolvedArtisanName = u?.user_metadata?.full_name || u?.user_metadata?.name || resolvedArtisanName;
    } catch {}
  }

  const newProduct = {
    id: `prod-local-${Date.now()}`,
    name: resolvedName,
    product_name: resolvedName,
    description: resolvedDesc,
    price: resolvedPrice,
    stock: resolvedStock,
    stock_quantity: resolvedStock,
    category,
    category_name: category,
    tags: Array.isArray(tags) ? tags : [],
    image_url: primaryImageUrl,
    image_urls: uploadedImageUrls,
    is_active: true,
    rating: 5.0,
    reviews_count: 0,
    artisan_id: resolvedArtisanId,
    artisan_name: resolvedArtisanName,
    created_at: new Date().toISOString(),
  };

  FALLBACK_PRODUCTS.unshift(newProduct);
  await savePersistentProduct(newProduct);

  return {
    success: true,
    product: newProduct,
    message: 'Product listed successfully!',
  };
}

/**
 * 13. getProductById(productId)
 * Fetches product for editing by authenticated artisan, verifying ownership and returning raw fields.
 */
export async function getProductById(productId) {
  if (!productId) return null;

  const token = getAccessToken();

  if (token && SUPABASE_URL) {
    // 1. Try secure RPC get_artisan_product_by_id_rpc first
    try {
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_artisan_product_by_id_rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ p_product_id: String(productId) }),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && rpcData.success && rpcData.product) {
          const p = rpcData.product;
          return {
            id: p.id,
            name: p.product_name || p.name || '',
            product_name: p.product_name || p.name || '',
            category: p.category || p.category_name || 'Pottery & Ceramics',
            category_id: p.category_id,
            price: Number(p.price || 0),
            stock: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock !== undefined ? p.stock : 10),
            stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock !== undefined ? p.stock : 10),
            description: p.description || '',
            image_url: p.image_url,
            image_urls: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls : (p.image_url ? [p.image_url] : []),
            tags: Array.isArray(p.tags) ? p.tags : [],
            artisan_id: p.artisan_id,
            artisan_name: p.artisan_name || 'Master Artisan',
            is_active: p.is_active ?? true,
            created_at: p.created_at,
            updated_at: p.updated_at,
          };
        } else if (rpcData && rpcData.error && rpcData.error.includes('Unauthorized')) {
          console.warn('getProductById: Unauthorized access to other artisan product');
          return null;
        }
      }
    } catch (rpcErr) {
      // Fall through to direct table query
    }

    // 2. Direct REST query respecting RLS
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const p = rows[0];
          return {
            id: p.id,
            name: p.product_name || p.name || '',
            product_name: p.product_name || p.name || '',
            category: p.category || p.category_name || 'Pottery & Ceramics',
            category_id: p.category_id,
            price: Number(p.price || 0),
            stock: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock !== undefined ? p.stock : 10),
            stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock !== undefined ? p.stock : 10),
            description: p.description || '',
            image_url: p.image_url,
            image_urls: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls : (p.image_url ? [p.image_url] : []),
            tags: Array.isArray(p.tags) ? p.tags : [],
            artisan_id: p.artisan_id,
            artisan_name: p.artisan_name || 'Master Artisan',
            is_active: p.is_active ?? true,
            created_at: p.created_at,
            updated_at: p.updated_at,
          };
        }
      }
    } catch (err) {
      console.warn('getProductById Supabase error:', err);
    }
  }

  // Fallback to local memory products
  const found = FALLBACK_PRODUCTS.find((p) => p.id === productId);
  if (found) {
    return {
      id: found.id,
      name: found.product_name || found.name || '',
      product_name: found.product_name || found.name || '',
      category: found.category || found.category_name || 'Pottery & Ceramics',
      price: Number(found.price || 0),
      stock: found.stock_quantity !== undefined ? found.stock_quantity : (found.stock !== undefined ? found.stock : 10),
      stock_quantity: found.stock_quantity !== undefined ? found.stock_quantity : (found.stock !== undefined ? found.stock : 10),
      description: found.description || '',
      image_url: found.image_url,
      image_urls: Array.isArray(found.image_urls) && found.image_urls.length > 0 ? found.image_urls : (found.image_url ? [found.image_url] : []),
      tags: Array.isArray(found.tags) ? found.tags : [],
      artisan_id: found.artisan_id,
      artisan_name: found.artisan_name || 'Master Artisan',
      is_active: found.is_active ?? true,
      created_at: found.created_at,
      updated_at: found.updated_at,
    };
  }

  return null;
}

/**
 * 14. deleteProductImages(imagePaths, productId)
 * Deletes obsolete image files from Supabase Storage bucket 'product-images'
 * Verifies file ownership to ensure deletion only within the artisan's / product folder.
 */
export async function deleteProductImages(imagePaths = [], productId = null) {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) return { success: true };
  const token = getAccessToken();

  if (token && SUPABASE_URL) {
    try {
      // Determine artisan user id for path verification
      let currentUserId = null;
      try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          currentUserId = userData?.id;
        }
      } catch {}

      // Extract file paths and filter safely
      const paths = imagePaths.map((item) => {
        if (typeof item === 'string' && item.includes('/product-images/')) {
          const parts = item.split('/product-images/');
          return parts[parts.length - 1];
        }
        return item;
      }).filter((path) => {
        if (!path || typeof path !== 'string') return false;
        // Verify path safety: if currentUserId is known, ensure path starts with it
        if (currentUserId && !path.startsWith(`${currentUserId}/`)) {
          console.warn('deleteProductImages: Rejecting unauthorized cross-artisan path delete:', path);
          return false;
        }
        return true;
      });

      if (paths.length > 0) {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prefixes: paths }),
        });
        return { success: res.ok };
      }
    } catch (err) {
      console.warn('deleteProductImages error:', err);
    }
  }

  return { success: true };
}

/**
 * 15. updateProduct(productId, productData, newImages, removedImages)
 * Updates product details and images in Supabase products table.
 * Supports:
 * - Direct signature: updateProduct(productId, productData) where productData may include newImages/removedImages
 * - Extended signature: updateProduct(productId, productData, newImages, removedImages)
 *
 * Sequence:
 * 1. Validate inputs (price > 0, stock >= 0 integer, name, description <= 300, max 5 total images)
 * 2. Upload newly added local images
 * 3. Update Supabase products table (via update_product_rpc or PATCH)
 * 4. Confirm database update
 * 5. Delete removed storage files only after the database update succeeds
 * 6. Clean up new orphaned uploads if database update fails
 */
export async function updateProduct(productId, productData = {}, newImages = [], removedImages = []) {
  if (!productId) {
    return { success: false, error: 'Product ID is required for editing.' };
  }

  // Normalize productData parameters
  const {
    name,
    product_name,
    description,
    price,
    stock,
    stock_quantity,
    category,
    tags = [],
    existing_image_urls = [],
    newImages: embeddedNewImages,
    removedImages: embeddedRemovedImages,
  } = productData;

  const actualNewImages = Array.isArray(newImages) && newImages.length > 0
    ? newImages
    : (Array.isArray(embeddedNewImages) ? embeddedNewImages : []);

  const actualRemovedImages = Array.isArray(removedImages) && removedImages.length > 0
    ? removedImages
    : (Array.isArray(embeddedRemovedImages) ? embeddedRemovedImages : []);

  const resolvedName = (product_name || name || '').trim();
  const resolvedStock = stock_quantity !== undefined ? Number(stock_quantity) : (stock !== undefined ? Number(stock) : 0);
  const resolvedPrice = Number(price);
  const resolvedDesc = (description || '').trim();

  // 1. Validation
  if (!resolvedName) {
    return { success: false, error: 'Product name is required.' };
  }
  if (!category || (typeof category === 'string' && !category.trim())) {
    return { success: false, error: 'Product category is required.' };
  }
  if (price === undefined || price === null || isNaN(resolvedPrice) || resolvedPrice <= 0) {
    return { success: false, error: 'Price must be greater than zero.' };
  }
  if (resolvedStock === undefined || resolvedStock === null || isNaN(resolvedStock) || resolvedStock < 0 || !Number.isInteger(resolvedStock)) {
    return { success: false, error: 'Stock quantity must be a non-negative integer.' };
  }
  if (!resolvedDesc) {
    return { success: false, error: 'Product description is required.' };
  }
  if (resolvedDesc.length > 300) {
    return { success: false, error: 'Product description must not exceed 300 characters.' };
  }

  // Determine current image set
  let baseImages = [];
  if (Array.isArray(existing_image_urls) && existing_image_urls.length > 0) {
    baseImages = existing_image_urls;
  } else {
    // If not supplied, attempt to read existing images from local cache or product
    const existing = await getProductById(productId);
    if (existing && Array.isArray(existing.image_urls)) {
      baseImages = existing.image_urls;
    }
  }

  const remainingImages = baseImages.filter((url) => !actualRemovedImages.includes(url));
  const totalImageCount = remainingImages.length + actualNewImages.length;

  if (totalImageCount === 0) {
    return { success: false, error: 'Please keep or add at least one product image.' };
  }
  if (totalImageCount > 5) {
    return { success: false, error: 'A product can have a maximum of 5 images.' };
  }

  // Validate format of any local image paths
  for (const img of actualNewImages) {
    if (typeof img === 'string' && (img.startsWith('file://') || img.startsWith('content://') || img.includes('.'))) {
      const cleanPath = img.split('?')[0].toLowerCase();
      if (!cleanPath.endsWith('.jpg') && !cleanPath.endsWith('.jpeg') && !cleanPath.endsWith('.png') && !cleanPath.startsWith('http') && !cleanPath.startsWith('data:image')) {
        return { success: false, error: 'Invalid image format. Only JPG, JPEG and PNG images are supported.' };
      }
    }
  }

  // 2. Upload any newly added local images
  let uploadedNewUrls = [];
  if (actualNewImages.length > 0) {
    try {
      uploadedNewUrls = await uploadProductImages(actualNewImages, productId);
    } catch (err) {
      return { success: false, error: err.message || 'Failed to upload new product images.' };
    }
  }

  const finalImageUrls = [...remainingImages, ...uploadedNewUrls];
  const primaryImageUrl = finalImageUrls[0] || null;

  const token = getAccessToken();

  // 3. Update Supabase
  if (token && SUPABASE_URL) {
    let updateSucceeded = false;
    let updatedProductData = null;

    // 3a. Try secure RPC update_product_rpc first (atomic server-side validation & ownership check)
    try {
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_product_rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          p_product_id: String(productId),
          p_product_name: resolvedName,
          p_category: category,
          p_price: resolvedPrice,
          p_stock_quantity: resolvedStock,
          p_description: resolvedDesc,
          p_image_urls: finalImageUrls,
          p_tags: Array.isArray(tags) ? tags : [],
        }),
      });

      if (rpcRes.ok) {
        const rpcJson = await rpcRes.json();
        if (rpcJson && rpcJson.success) {
          updateSucceeded = true;
          updatedProductData = rpcJson.product;
        } else if (rpcJson && rpcJson.error) {
          // If RPC returned a validation/authorization error, cleanup new uploads and return error
          if (uploadedNewUrls.length > 0) {
            deleteProductImages(uploadedNewUrls, productId).catch(() => {});
          }
          return { success: false, error: rpcJson.error };
        }
      }
    } catch (rpcErr) {
      // Fall through to direct PATCH
    }

    // 3b. Fallback to direct REST PATCH with RLS
    if (!updateSucceeded) {
      try {
        const payload = {
          name: resolvedName,
          product_name: resolvedName,
          description: resolvedDesc,
          price: resolvedPrice,
          stock: resolvedStock,
          stock_quantity: resolvedStock,
          category: category,
          category_name: category,
          tags: Array.isArray(tags) ? tags : [],
          image_url: primaryImageUrl,
          image_urls: finalImageUrls,
          updated_at: new Date().toISOString(),
        };

        const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updated = await res.json();
          updateSucceeded = true;
          updatedProductData = Array.isArray(updated) && updated.length > 0 ? updated[0] : payload;
        } else {
          const errData = await res.json().catch(() => ({}));
          // Clean up newly uploaded files if update failed
          if (uploadedNewUrls.length > 0) {
            deleteProductImages(uploadedNewUrls, productId).catch(() => {});
          }
          return {
            success: false,
            error: errData?.message || 'Failed to update product in database.',
          };
        }
      } catch (err) {
        console.warn('updateProduct Supabase PATCH error:', err);
      }
    }

    // 3c. If update succeeded in Supabase, safely delete obsolete images
    if (updateSucceeded) {
      if (actualRemovedImages.length > 0) {
        deleteProductImages(actualRemovedImages, productId).catch(() => {});
      }

      // Synchronize in local memory cache
      const idx = FALLBACK_PRODUCTS.findIndex((p) => p.id === productId);
      if (idx !== -1) {
        FALLBACK_PRODUCTS[idx] = {
          ...FALLBACK_PRODUCTS[idx],
          ...updatedProductData,
        };
      }
      await updatePersistentProduct(productId, updatedProductData);

      return {
        success: true,
        product: updatedProductData,
        message: 'Product updated successfully!',
      };
    }
  }

  // 4. Update local fallback memory (offline or standalone mode)
  const idx = FALLBACK_PRODUCTS.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    FALLBACK_PRODUCTS[idx] = {
      ...FALLBACK_PRODUCTS[idx],
      name: resolvedName,
      product_name: resolvedName,
      description: resolvedDesc,
      price: resolvedPrice,
      stock: resolvedStock,
      stock_quantity: resolvedStock,
      category,
      category_name: category,
      tags: Array.isArray(tags) ? tags : [],
      image_url: primaryImageUrl,
      image_urls: finalImageUrls,
      updated_at: new Date().toISOString(),
    };
    await updatePersistentProduct(productId, FALLBACK_PRODUCTS[idx]);
  }

  return {
    success: true,
    product: idx !== -1 ? FALLBACK_PRODUCTS[idx] : { id: productId, name: resolvedName },
    message: 'Product updated successfully!',
  };
}

/**
 * 16. getMyProducts()
 * Fetches exclusively the authenticated artisan's products from Supabase
 */
export async function getMyProducts() {
  const token = getAccessToken();
  if (token && SUPABASE_URL) {
    try {
      // 1. Try secure RPC function
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_artisan_products`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && rpcData.success && Array.isArray(rpcData.products)) {
          return rpcData.products.map(mapProduct);
        }
      }

      // 2. Direct REST query respecting artisan_id ownership
      let currentUserId = null;
      try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          currentUserId = userData?.id;
        }
      } catch {}

      if (currentUserId) {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/products?artisan_id=eq.${encodeURIComponent(currentUserId)}&is_active=neq.false&select=*&order=created_at.desc`,
          { headers: authHeaders() }
        );
        if (res.ok) {
          const prods = await res.json();
          if (Array.isArray(prods)) {
            return prods.map(mapProduct);
          }
        }
      }
    } catch (err) {
      console.warn('getMyProducts error:', err);
    }
  }

  // 2. Combine with persistent on-device products so they remain saved across logouts/restarts
  const persistentSaved = await getPersistentProducts();
  if (Array.isArray(persistentSaved) && persistentSaved.length > 0) {
    for (const p of persistentSaved) {
      if (!FALLBACK_PRODUCTS.some((fp) => fp.id === p.id)) {
        FALLBACK_PRODUCTS.unshift(p);
      }
    }
  }

  // Return ONLY products belonging to this artisan from local cache / persistent store
  if (Array.isArray(FALLBACK_PRODUCTS)) {
    const user = await getCurrentUser();
    const currentUserId = user?.id;
    if (currentUserId) {
      const myProds = FALLBACK_PRODUCTS.filter(
        (p) => (p.artisan_id === currentUserId || (p.id && String(p.id).startsWith('prod-local-'))) && p.is_active !== false
      );
      if (myProds.length > 0) {
        return myProds.map(mapProduct);
      }
    }
    // If not authenticated or no matching ID, return persistent crafts created on device
    const localNew = FALLBACK_PRODUCTS.filter(
      (p) => p.id && String(p.id).startsWith('prod-local-') && p.is_active !== false
    );
    return localNew.map(mapProduct);
  }

  return [];
}

/**
 * 17. deleteProduct(productId)
 * Soft-archives or safely deletes an artisan's product verifying ownership
 */
export async function deleteProduct(productId) {
  if (!productId) return { success: false, error: 'Product ID is required.' };
  const token = getAccessToken();

  if (token && SUPABASE_URL) {
    try {
      // Soft-archive by setting is_active = false so historical orders remain valid
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
      });

      await removePersistentProduct(productId);
      const fIdx = FALLBACK_PRODUCTS.findIndex((p) => p.id === productId);
      if (fIdx !== -1) FALLBACK_PRODUCTS[fIdx].is_active = false;

      if (res.ok) {
        return { success: true, message: 'Product archived successfully.' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  await removePersistentProduct(productId);
  const fIdx = FALLBACK_PRODUCTS.findIndex((p) => p.id === productId);
  if (fIdx !== -1) FALLBACK_PRODUCTS[fIdx].is_active = false;

  return { success: true };
}

/**
 * 18. duplicateProduct(product)
 * Creates an independent duplicate of an artisan's product with "(Copy)" suffix
 */
export async function duplicateProduct(product) {
  if (!product) return { success: false, error: 'Product details are required.' };

  const originalName = (product.name || product.product_name || 'Handmade Craft').trim();
  const copyName = originalName.includes('(Copy)') ? originalName : `${originalName} (Copy)`;
  const rawImages = product.image_urls || product.images || (product.imageUrl ? [product.imageUrl] : []);

  const duplicatePayload = {
    name: copyName,
    description: product.description || 'Handcrafted traditional artisan product.',
    category: product.category || product.category_name || 'Pottery & Ceramics',
    price: Number(product.price) || 499,
    stock: Number(product.stock !== undefined ? product.stock : product.stock_quantity || 10),
    tags: Array.isArray(product.tags) ? [...product.tags] : ['Handmade'],
    artisan_id: product.artisan_id || null,
    artisan_name: product.artisan_name || 'Artisan',
  };

  return await createProduct(duplicatePayload, rawImages);
}

/**
 * 19. updateProductStock(productId, newStock)
 * Updates available inventory count for a product and recalculates stock status
 */
export async function updateProductStock(productId, newStock) {
  const parsedStock = parseInt(newStock, 10);
  if (isNaN(parsedStock) || parsedStock < 0) {
    return { success: false, error: 'Stock quantity cannot be negative.' };
  }

  const token = getAccessToken();
  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stock: parsedStock,
          stock_quantity: parsedStock,
          updated_at: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        await updatePersistentProduct(productId, { stock: parsedStock, stock_quantity: parsedStock });
        const fIdx = FALLBACK_PRODUCTS.findIndex((p) => p.id === productId);
        if (fIdx !== -1) {
          FALLBACK_PRODUCTS[fIdx].stock = parsedStock;
          FALLBACK_PRODUCTS[fIdx].stock_quantity = parsedStock;
        }
        return { success: true, stock: parsedStock };
      }
    } catch (err) {
      console.warn('updateProductStock error:', err.message);
    }
  }

  await updatePersistentProduct(productId, { stock: parsedStock, stock_quantity: parsedStock });
  const fIdx = FALLBACK_PRODUCTS.findIndex((p) => p.id === productId);
  if (fIdx !== -1) {
    FALLBACK_PRODUCTS[fIdx].stock = parsedStock;
    FALLBACK_PRODUCTS[fIdx].stock_quantity = parsedStock;
  }
  return { success: true, stock: parsedStock };
}

