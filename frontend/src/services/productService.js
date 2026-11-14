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

import { getAccessToken } from './auth.js';

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
    } catch {
      // Fall through to fallback
    }
  }

  const fallback = FALLBACK_PRODUCTS.find((p) => p.id === productId);
  if (fallback && fallback.is_active) {
    return mapProduct(fallback);
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
      // Fall through
    }
  }

  // Local fallback filter
  let list = [...FALLBACK_PRODUCTS].filter((p) => p.is_active === true);
  if (filters.inStockOnly !== false) {
    list = list.filter((p) => (p.stock === undefined || p.stock > 0));
  }
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
  if (filters.category && filters.category.toLowerCase() !== 'all') {
    const cat = filters.category.toLowerCase().trim();
    list = list.filter((p) => (p.category_name || p.category || '').toLowerCase().includes(cat));
  }
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    list = list.filter((p) => p.price >= Number(filters.minPrice));
  }
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    list = list.filter((p) => p.price <= Number(filters.maxPrice));
  }
  if (filters.minRating !== null && filters.minRating !== undefined) {
    list = list.filter((p) => (p.rating || 0) >= Number(filters.minRating));
  }

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
 * 11. uploadProductImages(images)
 * Uploads local image URIs to Supabase Storage bucket 'products'
 */
export async function uploadProductImages(images = []) {
  if (!Array.isArray(images) || images.length === 0) return [];
  const token = getAccessToken();

  const uploadedUrls = [];

  for (const uri of images) {
    // If it's already a remote HTTP URL, keep it
    if (typeof uri === 'string' && uri.startsWith('http')) {
      uploadedUrls.push(uri);
      continue;
    }

    if (token && SUPABASE_URL) {
      try {
        const filename = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/products/${filename}`;

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: filename,
          type: 'image/jpeg',
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
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/products/${filename}`;
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
 * Validates, uploads images and inserts new product into Supabase products table
 */
export async function createProduct(productData, images = []) {
  const {
    name,
    description,
    price,
    stock = 10,
    category = 'Pottery & Ceramics',
    tags = [],
    artisan_id = null,
    artisan_name = 'Master Artisan',
  } = productData;

  // Validation
  if (!name || !name.trim()) {
    return { success: false, error: 'Product name is required.' };
  }
  if (!price || Number(price) <= 0) {
    return { success: false, error: 'Price must be greater than zero.' };
  }
  if (stock === undefined || Number(stock) < 0) {
    return { success: false, error: 'Stock must be a non-negative integer.' };
  }
  if (!description || !description.trim()) {
    return { success: false, error: 'Product description is required.' };
  }
  if (description.trim().length > 300) {
    return { success: false, error: 'Description must not exceed 300 characters.' };
  }
  if (!images || images.length === 0) {
    return { success: false, error: 'Please add at least one product image.' };
  }

  // Upload images
  const uploadedImageUrls = await uploadProductImages(images);
  const primaryImageUrl = uploadedImageUrls[0] || null;

  const token = getAccessToken();

  if (token && SUPABASE_URL) {
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock: parseInt(stock, 10),
        category: category,
        category_name: category,
        tags: Array.isArray(tags) ? tags : [],
        image_url: primaryImageUrl,
        image_urls: uploadedImageUrls,
        is_active: true,
        is_curated: true,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (artisan_id) payload.artisan_id = artisan_id;
      if (artisan_name) payload.artisan_name = artisan_name;

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
        return {
          success: true,
          product: Array.isArray(inserted) ? inserted[0] : inserted,
          message: 'Product listed successfully on ShilpSetu!',
        };
      }
    } catch (err) {
      console.warn('createProduct Supabase insert error:', err);
    }
  }

  // Local fallback response
  const newProduct = {
    id: `prod-local-${Date.now()}`,
    name: name.trim(),
    description: description.trim(),
    price: Number(price),
    stock: parseInt(stock, 10),
    category,
    tags,
    image_url: primaryImageUrl,
    image_urls: uploadedImageUrls,
    is_active: true,
    rating: 5.0,
    reviews_count: 0,
    created_at: new Date().toISOString(),
  };

  FALLBACK_PRODUCTS.unshift(newProduct);

  return {
    success: true,
    product: newProduct,
    message: 'Product listed successfully!',
  };
}
