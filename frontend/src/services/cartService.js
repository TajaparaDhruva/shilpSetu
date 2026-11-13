/**
 * cartService.js — Complete Cart Service for ShilpSetu
 *
 * Implements:
 * - getCartItems()
 * - updateCartQuantity(productId, quantity)
 * - removeCartItem(productId)
 * - clearCart()
 * - getCartSummary()
 * - addToCart(productOrId, quantity)
 * - getCartCount()
 * - getCart()
 */

import { getCurrentUser, getAccessToken } from './auth.js';
import { FALLBACK_PRODUCTS } from './productService.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const DEFAULT_CART_ITEMS = [
  {
    id: 'cart-item-1',
    product_id: 'prod-pot-1',
    product: FALLBACK_PRODUCTS[0],
    quantity: 1,
    addedAt: new Date().toISOString(),
  },
  {
    id: 'cart-item-2',
    product_id: 'prod-jewel-1',
    product: FALLBACK_PRODUCTS[2],
    quantity: 1,
    addedAt: new Date().toISOString(),
  },
];

const localCart = new Map();
DEFAULT_CART_ITEMS.forEach((item) => {
  localCart.set(item.product_id, item);
});

function authHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * 1. getCartItems() / getCart()
 * Retrieve the authenticated customer's cart items with full product details
 */
export async function getCartItems() {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${user.id}&select=*,products(*)`,
        { headers: authHeaders(token) }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localCart.clear();
          data.forEach((item) => {
            localCart.set(item.product_id, {
              product: item.products || { id: item.product_id },
              quantity: item.quantity,
              id: item.id,
            });
          });
        }
      }
    } catch {
      // In-memory returns
    }
  }

  return Array.from(localCart.values());
}

export const getCart = getCartItems;

/**
 * 2. updateCartQuantity(productId, quantity)
 */
export async function updateCartQuantity(productId, quantity) {
  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return removeCartItem(productId);
  }

  const existing = localCart.get(productId);
  if (existing) {
    existing.quantity = parsedQty;
    localCart.set(productId, existing);
  }

  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${user.id}&product_id=eq.${productId}`,
        {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ quantity: parsedQty, updated_at: new Date().toISOString() }),
        }
      );
    } catch {}
  }

  return { success: true, product_id: productId, quantity: parsedQty };
}

/**
 * 3. removeCartItem(productId)
 */
export async function removeCartItem(productId) {
  localCart.delete(productId);

  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${user.id}&product_id=eq.${productId}`,
        {
          method: 'DELETE',
          headers: authHeaders(token),
        }
      );
    } catch {}
  }

  return { success: true, product_id: productId };
}

/**
 * 4. clearCart()
 */
export async function clearCart() {
  localCart.clear();

  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${user.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
    } catch {}
  }

  return { success: true };
}

/**
 * 5. getCartSummary()
 */
export async function getCartSummary() {
  const items = await getCartItems();
  let subtotal = 0;
  let totalItems = 0;

  for (const item of items) {
    const price = Number(item.product?.price || 0);
    const qty = Number(item.quantity || 1);
    subtotal += price * qty;
    totalItems += qty;
  }

  return {
    totalItems,
    subtotal,
    deliveryFee: items.length > 0 ? 49 : 0,
    estimatedTotal: items.length > 0 ? subtotal + 49 : 0,
  };
}

/**
 * Add a product to the user's cart with atomic DB RPC
 */
export async function addToCart(productOrId, quantity = 1) {
  const productId = typeof productOrId === 'object' ? (productOrId.id || productOrId.product_id) : productOrId;
  const productObj = typeof productOrId === 'object' ? productOrId : { id: productId };

  if (!productId) {
    return { success: false, error: 'Product not found' };
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return { success: false, error: 'Invalid quantity' };
  }

  if (productObj.is_active === false) {
    return { success: false, error: 'Product is currently unavailable' };
  }

  const existing = localCart.get(productId);
  const currentQty = existing ? existing.quantity : 0;
  const newQty = currentQty + parsedQty;

  if (productObj.stock !== undefined && productObj.stock > 0 && newQty > productObj.stock) {
    return {
      success: false,
      error: `Insufficient stock: only ${productObj.stock} available`,
      available_stock: productObj.stock,
    };
  }

  localCart.set(productId, {
    product: productObj,
    quantity: newQty,
    addedAt: new Date().toISOString(),
  });

  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/add_to_cart_item`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          p_product_id: productId,
          p_quantity: parsedQty,
        }),
      });
    } catch {}
  }

  return {
    success: true,
    product_id: productId,
    quantity: newQty,
    totalItems: getCartCount(),
  };
}

export function getCartCount() {
  let count = 0;
  for (const item of localCart.values()) {
    count += item.quantity;
  }
  return count;
}
