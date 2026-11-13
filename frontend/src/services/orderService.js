/**
 * orderService.js — Order Management for ShilpSetu
 *
 * Places orders, retrieves order history, and manages order lifecycle.
 * Uses in-memory duplicate-lock to prevent double-submission per session.
 */

import { getAccessToken, getCurrentUser } from './auth.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ─── In-memory duplicate lock ─────────────────────────────────────────────────

const _placingOrderLock = new Set();

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
 * Generate an order number in the format SS-YYYYMMDD-XXXX
 * @returns {string}
 */
function generateOrderNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `SS-${yyyy}${mm}${dd}-${suffix}`;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Place a new order
 * @param {Object} orderData
 * @param {string} orderData.addressId
 * @param {string} orderData.deliveryOption - 'standard' | 'express'
 * @param {string} orderData.paymentMethod - 'cod' | 'upi' | 'card' | 'netbanking'
 * @param {Array}  orderData.cartItems
 * @param {string} [orderData.couponCode]
 * @param {number} orderData.totalAmount
 * @param {number} [orderData.itemTotal]
 * @param {number} [orderData.productDiscount]
 * @param {number} [orderData.couponDiscount]
 * @param {number} [orderData.deliveryCharge]
 * @returns {Promise<{ success: boolean, orderId?: string, orderNumber?: string, error?: string }>}
 */
export async function placeOrder(orderData) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !token) {
    return { success: false, error: 'Authentication required to place an order' };
  }

  // Duplicate-submission guard per session
  const lockKey = `${user.id}_${Date.now()}`;
  // Use user id as the key — a second call within 2s is a duplicate
  const userLockKey = user.id;
  if (_placingOrderLock.has(userLockKey)) {
    return { success: false, error: 'Order is already being placed. Please wait.' };
  }
  _placingOrderLock.add(userLockKey);

  try {
    if (!SUPABASE_URL) {
      return { success: false, error: 'Service configuration missing' };
    }

    const {
      addressId,
      deliveryOption,
      paymentMethod,
      cartItems,
      couponCode,
      totalAmount,
      itemTotal = 0,
      productDiscount = 0,
      couponDiscount = 0,
      deliveryCharge = 49,
    } = orderData;

    if (!addressId) return { success: false, error: 'Delivery address is required' };
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const orderNumber = generateOrderNumber();
    const paymentStatus = paymentMethod === 'cod' ? 'cod_pending' : 'pending';

    // 1. Insert order row
    const orderPayload = {
      user_id: user.id,
      order_number: orderNumber,
      address_id: addressId,
      delivery_option: deliveryOption || 'standard',
      payment_method: paymentMethod || 'cod',
      payment_status: paymentStatus,
      status: 'pending',
      item_total: Number(itemTotal) || 0,
      product_discount: Number(productDiscount) || 0,
      coupon_discount: Number(couponDiscount) || 0,
      delivery_charge: Number(deliveryCharge) || 49,
      total_amount: Number(totalAmount) || 0,
      coupon_code: couponCode || null,
      created_at: new Date().toISOString(),
    };

    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: { ...authHeaders(token), Prefer: 'return=representation' },
      body: JSON.stringify(orderPayload),
    });

    if (!orderRes.ok) {
      const err = await orderRes.json().catch(() => ({}));
      return { success: false, error: err.message || 'Failed to create order' };
    }

    const orderRows = await orderRes.json();
    const order = Array.isArray(orderRows) ? orderRows[0] : orderRows;
    const orderId = order?.id;

    if (!orderId) {
      return { success: false, error: 'Order created but ID not returned' };
    }

    // 2. Insert order items
    const orderItems = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.product?.id || item.product_id,
      quantity: item.quantity,
      unit_price: item.product?.price ?? item.price ?? 0,
      original_price: item.product?.original_price ?? item.original_price ?? null,
      product_name: item.product?.name ?? item.name ?? '',
    }));

    const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
      method: 'POST',
      headers: { ...authHeaders(token), Prefer: 'return=minimal' },
      body: JSON.stringify(orderItems),
    });

    if (!itemsRes.ok) {
      // Log warning but don't fail the whole order
      console.warn('orderService: Failed to insert order_items, order was still created');
    }

    // 3. Clear cart items for this user
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${user.id}`,
        {
          method: 'DELETE',
          headers: { ...authHeaders(token), Prefer: 'return=minimal' },
        }
      );
    } catch {
      // Non-fatal: cart will re-sync on next load
    }

    return { success: true, orderId, orderNumber, order };
  } catch (e) {
    return { success: false, error: e.message || 'Network error while placing order' };
  } finally {
    _placingOrderLock.delete(userLockKey);
  }
}

/**
 * Get a single order with its items
 * @param {string} orderId
 * @returns {Promise<{ success: boolean, order?: Object, error?: string }>}
 */
export async function getOrder(orderId) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !token) {
    return { success: false, error: 'Authentication required' };
  }
  if (!orderId) {
    return { success: false, error: 'Order ID is required' };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&user_id=eq.${user.id}&select=*,order_items(*,products(*)),customer_addresses(*)`,
      { headers: authHeaders(token) }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Failed to fetch order' };
    }

    const data = await res.json();
    const order = Array.isArray(data) ? data[0] : data;

    if (!order) return { success: false, error: 'Order not found' };

    return { success: true, order };
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Get paginated order history for the current user
 * @param {number} page - 1-indexed page number (default 1)
 * @param {number} limit - Items per page (default 10)
 * @returns {Promise<{ success: boolean, orders?: Array, page: number, limit: number, error?: string }>}
 */
export async function getMyOrders(page = 1, limit = 10) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !token) {
    return { success: false, orders: [], error: 'Authentication required' };
  }

  const offset = (Math.max(1, page) - 1) * limit;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?user_id=eq.${user.id}&select=*,order_items(id,quantity,unit_price,product_name)&order=created_at.desc&limit=${limit}&offset=${offset}`,
      { headers: authHeaders(token) }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, orders: [], error: err.message || 'Failed to fetch orders' };
    }

    const orders = await res.json();
    return { success: true, orders: Array.isArray(orders) ? orders : [], page, limit };
  } catch (e) {
    return { success: false, orders: [], error: e.message || 'Network error' };
  }
}

/**
 * Cancel a pending order
 * @param {string} orderId
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function cancelOrder(orderId) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (!user || !token) return { success: false, error: 'Authentication required' };
  if (!orderId) return { success: false, error: 'Order ID is required' };

  try {
    // Verify the order is in a cancellable state
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&user_id=eq.${user.id}&select=id,status`,
      { headers: authHeaders(token) }
    );

    if (!checkRes.ok) return { success: false, error: 'Failed to fetch order' };

    const rows = await checkRes.json();
    const order = Array.isArray(rows) ? rows[0] : null;

    if (!order) return { success: false, error: 'Order not found' };
    if (order.status !== 'pending') {
      return { success: false, error: `Cannot cancel order with status: ${order.status}` };
    }

    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&user_id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: { ...authHeaders(token), Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'cancelled', updated_at: new Date().toISOString() }),
      }
    );

    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      return { success: false, error: err.message || 'Failed to cancel order' };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
}
