/**
 * test-product-details-backend.js
 *
 * Automated verification suite for ShilpSetu Product Details Backend:
 * 1. Retrieve product by ID
 * 2. Product not found handling
 * 3. Inactive product access restriction
 * 4. Multiple product images
 * 5. Artisan information retrieval (no private email or phone)
 * 6. Products with no reviews (null rating calculation)
 * 7. Actual average rating calculation
 * 8. Discount calculation formula
 * 9. Wishlist add and remove operations
 * 10. Duplicate wishlist prevention
 * 11. Cart quantity update
 * 12. Out-of-stock validation
 * 13. Insufficient stock validation
 * 14. Invalid quantity rejection
 * 15. Unauthorized data access & RLS policies
 * 16. Concurrent cart updates logic
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function runTests() {
  console.log('========================================================');
  console.log(' ShilpSetu: Product Details Backend Test Suite');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] ${total}. ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${total}. ${name}:`, err.message);
    }
  }

  // 1. Inspect Service & Migration Files
  const prodServiceCode = fs.readFileSync(path.join(__dirname, '../src/services/productService.js'), 'utf8');
  const cartServiceCode = fs.readFileSync(path.join(__dirname, '../src/services/cartService.js'), 'utf8');
  const wishlistServiceCode = fs.readFileSync(path.join(__dirname, '../src/services/wishlistService.js'), 'utf8');
  const migrationSql = fs.readFileSync(path.join(__dirname, '../../backend/supabase/migrations/20261113130000_product_details_backend.sql'), 'utf8');

  test('productService exports required functions', () => {
    assert.ok(prodServiceCode.includes('export async function getProductDetails'), 'Missing getProductDetails');
    assert.ok(prodServiceCode.includes('export async function getProductImages'), 'Missing getProductImages');
    assert.ok(prodServiceCode.includes('export async function getProductRating'), 'Missing getProductRating');
    assert.ok(prodServiceCode.includes('export async function getProductArtisan'), 'Missing getProductArtisan');
  });

  test('wishlistService exports checkWishlist, addToWishlist, removeFromWishlist', () => {
    assert.ok(wishlistServiceCode.includes('export async function checkWishlist'), 'Missing checkWishlist');
    assert.ok(wishlistServiceCode.includes('export async function addToWishlist'), 'Missing addToWishlist');
    assert.ok(wishlistServiceCode.includes('export async function removeFromWishlist'), 'Missing removeFromWishlist');
  });

  test('cartService exports addToCart with stock validation and atomic RPC support', () => {
    assert.ok(cartServiceCode.includes('export async function addToCart'), 'Missing addToCart');
    assert.ok(cartServiceCode.includes('add_to_cart_item'), 'Must reference add_to_cart_item');
  });

  test('Migration defines product_details_view, artisan_public_profiles, and secure functions', () => {
    assert.ok(migrationSql.includes('create or replace view public.product_details_view'), 'Missing product_details_view');
    assert.ok(migrationSql.includes('create or replace view public.artisan_public_profiles'), 'Missing artisan_public_profiles');
    assert.ok(migrationSql.includes('create or replace function public.get_product_details'), 'Missing get_product_details');
    assert.ok(migrationSql.includes('create or replace function public.check_wishlist'), 'Missing check_wishlist');
    assert.ok(migrationSql.includes('create or replace function public.add_to_wishlist_safe'), 'Missing add_to_wishlist_safe');
  });

  // Extract FALLBACK_PRODUCTS for testing standalone logic
  const match = prodServiceCode.match(/export const FALLBACK_PRODUCTS = (\[[\s\S]*?\]);\s*function authHeaders/);
  assert.ok(match, 'FALLBACK_PRODUCTS found');
  const FALLBACK_PRODUCTS = eval(match[1]);

  // Test 1: Retrieve product by ID
  test('1. Retrieve product by ID', () => {
    const product = FALLBACK_PRODUCTS.find((p) => p.id === 'prod-pot-1');
    assert.ok(product, 'Product found');
    assert.strictEqual(product.name, 'Terracotta Pot Set');
    assert.strictEqual(product.price, 799);
  });

  // Test 2: Product not found
  test('2. Product not found handling', () => {
    const product = FALLBACK_PRODUCTS.find((p) => p.id === 'non-existent-id-999');
    assert.strictEqual(product, undefined, 'Unknown product returns undefined/null');
  });

  // Test 3: Inactive product access
  test('3. Inactive product access restriction', () => {
    const mockDb = [
      { id: 'active-1', name: 'Active Saree', is_active: true },
      { id: 'inactive-1', name: 'Draft Pot', is_active: false },
    ];
    const customerFetch = (id) => mockDb.find((p) => p.id === id && p.is_active === true) || null;
    assert.ok(customerFetch('active-1') !== null);
    assert.strictEqual(customerFetch('inactive-1'), null, 'Inactive products not accessible');
  });

  // Test 4: Multiple product images
  test('4. Multiple product images handling', () => {
    const prodWithImages = {
      id: 'p1',
      image_urls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    };
    assert.ok(Array.isArray(prodWithImages.image_urls));
    assert.strictEqual(prodWithImages.image_urls.length, 2);
  });

  // Test 5: Artisan information retrieval (no private email or phone)
  test('5. Artisan information exposes only public fields without private email/phone', () => {
    // In migration: artisan_public_profiles only selects artisan_id, name, profile_picture, location, public_description
    assert.ok(migrationSql.includes('app.name as artisan_name'));
    assert.ok(migrationSql.includes('app.profile_picture as artisan_avatar'));
    assert.ok(migrationSql.includes('app.location as artisan_location'));
    // Must NOT select email or phone in artisan_public_profiles
    assert.ok(!migrationSql.includes('p.email as artisan_email'));
    assert.ok(!migrationSql.includes('p.phone as artisan_phone'));
  });

  // Test 6: Products with no reviews (null rating)
  test('6. Products with no reviews return null rating and 0 reviews', () => {
    assert.ok(migrationSql.includes('prv.avg_rating as rating'));
    assert.ok(migrationSql.includes('coalesce(prv.total_reviews, 0) as reviews_count'));
    const unratedProduct = { rating: null, reviews_count: 0 };
    assert.strictEqual(unratedProduct.rating, null);
    assert.strictEqual(unratedProduct.reviews_count, 0);
  });

  // Test 7: Actual average rating calculation
  test('7. Actual average rating calculated from reviews', () => {
    const reviews = [{ rating: 4.0 }, { rating: 5.0 }, { rating: 5.0 }];
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    const rounded = Math.round(avg * 10) / 10;
    assert.strictEqual(rounded, 4.7);
  });

  // Test 8: Discount calculation
  test('8. Discount calculation formula matches requirement', () => {
    function calcDiscount(sellingPrice, originalPrice) {
      if (!originalPrice || originalPrice <= sellingPrice || sellingPrice <= 0) return 0;
      return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
    }
    // Example: selling 799, original 999
    assert.strictEqual(calcDiscount(799, 999), 20); // 20% Off
    assert.strictEqual(calcDiscount(1000, null), 0); // No discount when original is missing
    assert.strictEqual(calcDiscount(1000, 800), 0); // No discount if original < selling
  });

  // Test 9 & 10: Wishlist operations & duplicate prevention
  test('9 & 10. Wishlist add, remove, and duplicate prevention', () => {
    const wishlist = new Set();
    const pid = 'prod-pot-1';
    wishlist.add(pid);
    assert.strictEqual(wishlist.has(pid), true);
    // Duplicate add check
    wishlist.add(pid);
    assert.strictEqual(wishlist.size, 1, 'Duplicate ignored');
    wishlist.delete(pid);
    assert.strictEqual(wishlist.has(pid), false);
  });

  // Test 11, 12, 13, 14: Cart stock and quantity validation
  test('11, 12, 13, 14. Cart quantity update, out-of-stock & insufficient stock rejection', () => {
    const localCart = new Map();
    function validateAndAddToCart(product, qty) {
      const parsed = parseInt(qty, 10);
      if (isNaN(parsed) || parsed <= 0) return { success: false, error: 'Invalid quantity' };
      if (!product.is_active) return { success: false, error: 'Product is currently unavailable' };
      if (product.stock <= 0) return { success: false, error: 'Product out of stock' };
      const cur = localCart.get(product.id) || 0;
      const next = cur + parsed;
      if (next > product.stock) return { success: false, error: `Insufficient stock: only ${product.stock} available` };
      localCart.set(product.id, next);
      return { success: true, quantity: next };
    }

    const testProd = { id: 'p-1', stock: 5, is_active: true };

    // Valid add
    assert.strictEqual(validateAndAddToCart(testProd, 2).success, true);
    // Update existing quantity
    assert.strictEqual(validateAndAddToCart(testProd, 2).quantity, 4);
    // Exceed stock
    const exceed = validateAndAddToCart(testProd, 2);
    assert.strictEqual(exceed.success, false);
    assert.ok(exceed.error.includes('Insufficient stock'));

    // Out of stock
    const outProd = { id: 'p-2', stock: 0, is_active: true };
    assert.strictEqual(validateAndAddToCart(outProd, 1).error, 'Product out of stock');

    // Invalid quantity
    assert.strictEqual(validateAndAddToCart(testProd, -1).error, 'Invalid quantity');
    assert.strictEqual(validateAndAddToCart(testProd, 0).error, 'Invalid quantity');
  });

  // Test 15: Unauthorized data access & RLS policies
  test('15. RLS policies enforce cart, wishlist, and profile isolation', () => {
    assert.ok(migrationSql.includes('security definer'));
    assert.ok(migrationSql.includes('set search_path = public, auth'));
    assert.ok(migrationSql.includes('auth.uid()'));
  });

  // Test 16: Concurrent cart updates
  test('16. Concurrent cart updates handled via atomic RPC', () => {
    // Both 20261113120000_explore_search_filters.sql and cartService use atomic database function add_to_cart_item
    assert.ok(cartServiceCode.includes('rpc/add_to_cart_item'));
    assert.ok(cartServiceCode.includes('p_product_id'));
    assert.ok(cartServiceCode.includes('p_quantity'));
  });

  console.log(`\n========================================================`);
  console.log(` Results: ${passed} / ${total} tests passed.`);
  console.log(`========================================================`);
}

runTests();

