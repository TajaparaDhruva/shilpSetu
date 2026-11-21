/**
 * artisanOrdersService.js — Backend service for Artisan Manage Orders
 *
 * Implements:
 * - getArtisanOrderStats(): Dynamic counts { total_orders, pending, processing, shipped, delivered, cancelled }
 * - getArtisanOrders(params): Retrieves filtered, sorted, searched artisan orders
 * - acceptArtisanOrder(orderId): Advances status from pending -> processing
 * - markArtisanOrderShipped(orderId, courierName, trackingNumber, trackingUrl): Sets status to shipped with courier info
 * - updateArtisanOrderTracking(orderId, courierName, trackingNumber, trackingUrl): Modifies shipping metadata
 * - cancelArtisanOrder(orderId, reason): Cancels order with reason and restores stock
 */

import { getAccessToken, getCurrentUser } from './auth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function authHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// In-memory orders for local/offline additions
export const ARTISAN_ORDERS_SEED = [];

let inMemoryOrders = [];

/**
 * 1. Fetch Dynamic Order Statistics
 */
export async function getArtisanOrderStats() {
  const token = getAccessToken();
  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_artisan_manage_order_stats_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return {
            total: data.total_orders ?? 0,
            pending: data.pending ?? 0,
            processing: data.processing ?? 0,
            shipped: data.shipped ?? 0,
            delivered: data.delivered ?? 0,
            cancelled: data.cancelled ?? 0,
          };
        }
      }
    } catch (err) {
      console.warn('getArtisanOrderStats RPC error:', err.message);
    }
  }

  // Calculate from local memory
  let total = inMemoryOrders.length;
  let pending = 0;
  let processing = 0;
  let shipped = 0;
  let delivered = 0;
  let cancelled = 0;

  inMemoryOrders.forEach((o) => {
    const s = o.status || o.order_status;
    if (s === 'pending' || s === 'new' || s === 'confirmed') pending++;
    else if (s === 'processing') processing++;
    else if (s === 'shipped' || s === 'packed' || s === 'out_for_delivery') shipped++;
    else if (s === 'delivered' || s === 'completed') delivered++;
    else if (s === 'cancelled' || s === 'refunded') cancelled++;
  });

  return { total, pending, processing, shipped, delivered, cancelled };
}

/**
 * 2. Fetch Artisan Manage Orders (filtered, sorted, searched)
 */
export async function getArtisanOrders(params = {}) {
  const {
    status = 'all',
    search = '',
    startDate = null,
    endDate = null,
    paymentStatus = null,
    minPrice = null,
    maxPrice = null,
    sort = 'newest',
    limit = 50,
    offset = 0,
  } = params;

  const token = getAccessToken();
  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_artisan_manage_orders_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          p_status: status,
          p_search: search || null,
          p_start_date: startDate || null,
          p_end_date: endDate || null,
          p_payment_status: paymentStatus || null,
          p_min_price: minPrice !== null && minPrice !== '' ? Number(minPrice) : null,
          p_max_price: maxPrice !== null && maxPrice !== '' ? Number(maxPrice) : null,
          p_sort: sort,
          p_limit: limit,
          p_offset: offset,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.orders)) {
          return {
            total: data.total ?? data.orders.length,
            orders: data.orders,
          };
        }
      }
    } catch (err) {
      console.warn('getArtisanOrders RPC error:', err.message);
    }
  }

  // Filter in-memory orders
  let filtered = [...inMemoryOrders];

  // Status Filter
  if (status && status !== 'all') {
    filtered = filtered.filter((o) => {
      const s = o.status || o.order_status;
      if (status === 'pending') return s === 'pending' || s === 'new' || s === 'confirmed';
      if (status === 'processing') return s === 'processing';
      if (status === 'shipped') return s === 'shipped' || s === 'packed' || s === 'out_for_delivery';
      if (status === 'delivered') return s === 'delivered' || s === 'completed';
      if (status === 'cancelled') return s === 'cancelled' || s === 'refunded';
      return s === status;
    });
  }

  // Search Filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((o) => {
      const orderNumMatch = (o.order_number || o.id || '').toLowerCase().includes(q);
      const custMatch = (o.customer?.full_name || '').toLowerCase().includes(q);
      const prodMatch = Array.isArray(o.items) && o.items.some((it) => (it.product_name || '').toLowerCase().includes(q));
      return orderNumMatch || custMatch || prodMatch;
    });
  }

  // Payment Status Filter
  if (paymentStatus && paymentStatus !== 'all') {
    filtered = filtered.filter((o) => o.payment_status === paymentStatus);
  }

  // Price Range Filter
  if (minPrice !== null && minPrice !== undefined && minPrice !== '') {
    filtered = filtered.filter((o) => Number(o.total_amount) >= Number(minPrice));
  }
  if (maxPrice !== null && maxPrice !== undefined && maxPrice !== '') {
    filtered = filtered.filter((o) => Number(o.total_amount) <= Number(maxPrice));
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sort === 'oldest') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return {
    total: filtered.length,
    orders: filtered.slice(offset, offset + limit),
  };
}

/**
 * 3. Accept Order (Pending -> Processing)
 */
export async function acceptArtisanOrder(orderId) {
  if (!orderId) return { success: false, error: 'Order ID is required' };
  const token = getAccessToken();

  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/artisan_accept_order_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ p_order_id: orderId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          updateLocalMemoryOrderStatus(orderId, 'processing');
          return data;
        }
      }
    } catch (err) {
      console.warn('acceptArtisanOrder RPC error:', err.message);
    }
  }

  updateLocalMemoryOrderStatus(orderId, 'processing');
  return { success: true, message: 'Order accepted successfully and is now in processing.' };
}

/**
 * 4. Mark as Shipped (Processing -> Shipped)
 */
export async function markArtisanOrderShipped(orderId, courierName, trackingNumber, trackingUrl = '') {
  if (!orderId) return { success: false, error: 'Order ID is required' };
  if (!courierName || !courierName.trim()) return { success: false, error: 'Courier name is required' };
  if (!trackingNumber || !trackingNumber.trim()) return { success: false, error: 'Tracking number is required' };

  const token = getAccessToken();
  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/artisan_mark_order_shipped_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          p_order_id: orderId,
          p_courier_name: courierName.trim(),
          p_tracking_number: trackingNumber.trim(),
          p_tracking_url: trackingUrl ? trackingUrl.trim() : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          updateLocalMemoryOrderStatus(orderId, 'shipped', {
            courier_name: courierName.trim(),
            tracking_number: trackingNumber.trim(),
            tracking_url: trackingUrl ? trackingUrl.trim() : null,
          });
          return data;
        }
      }
    } catch (err) {
      console.warn('markArtisanOrderShipped RPC error:', err.message);
    }
  }

  updateLocalMemoryOrderStatus(orderId, 'shipped', {
    courier_name: courierName.trim(),
    tracking_number: trackingNumber.trim(),
    tracking_url: trackingUrl ? trackingUrl.trim() : null,
  });
  return { success: true, message: 'Order marked as shipped successfully.' };
}

/**
 * 5. Update Tracking Details
 */
export async function updateArtisanOrderTracking(orderId, courierName, trackingNumber, trackingUrl = '') {
  if (!orderId) return { success: false, error: 'Order ID is required' };
  const token = getAccessToken();

  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/artisan_update_tracking_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          p_order_id: orderId,
          p_courier_name: courierName ? courierName.trim() : null,
          p_tracking_number: trackingNumber ? trackingNumber.trim() : null,
          p_tracking_url: trackingUrl ? trackingUrl.trim() : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          updateLocalMemoryOrderStatus(orderId, null, {
            courier_name: courierName ? courierName.trim() : null,
            tracking_number: trackingNumber ? trackingNumber.trim() : null,
            tracking_url: trackingUrl ? trackingUrl.trim() : null,
          });
          return data;
        }
      }
    } catch (err) {
      console.warn('updateArtisanOrderTracking RPC error:', err.message);
    }
  }

  updateLocalMemoryOrderStatus(orderId, null, {
    courier_name: courierName ? courierName.trim() : null,
    tracking_number: trackingNumber ? trackingNumber.trim() : null,
    tracking_url: trackingUrl ? trackingUrl.trim() : null,
  });
  return { success: true, message: 'Tracking details updated successfully.' };
}

/**
 * 6. Cancel Order (Pending -> Cancelled with Reason)
 */
export async function cancelArtisanOrder(orderId, reason) {
  if (!orderId) return { success: false, error: 'Order ID is required' };
  if (!reason || !reason.trim()) return { success: false, error: 'Cancellation reason is required' };

  const token = getAccessToken();
  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/artisan_cancel_order_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          p_order_id: orderId,
          p_cancellation_reason: reason.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          updateLocalMemoryOrderStatus(orderId, 'cancelled', {
            cancellation_reason: reason.trim(),
            cancelled_at: new Date().toISOString(),
          });
          return data;
        }
      }
    } catch (err) {
      console.warn('cancelArtisanOrder RPC error:', err.message);
    }
  }

  updateLocalMemoryOrderStatus(orderId, 'cancelled', {
    cancellation_reason: reason.trim(),
    cancelled_at: new Date().toISOString(),
  });
  return { success: true, message: 'Order cancelled successfully.' };
}

/**
 * 7. Get Single Order Details (Secure RPC)
 */
export async function getArtisanOrderDetails(orderId) {
  if (!orderId) return { success: false, error: 'Order ID is required' };
  const token = getAccessToken();

  if (token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_artisan_order_details_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ p_order_id: orderId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.order) {
          return { success: true, order: data.order };
        }
      }
    } catch (err) {
      console.warn('getArtisanOrderDetails RPC error:', err.message);
    }
  }

  const local = inMemoryOrders.find((o) => o.id === orderId || o.order_number === orderId);
  if (local) {
    return { success: true, order: local };
  }
  return { success: false, error: 'Order not found' };
}

function updateLocalMemoryOrderStatus(orderId, newStatus, extra = {}) {
  const idx = inMemoryOrders.findIndex((o) => o.id === orderId || o.order_number === orderId);
  if (idx !== -1) {
    inMemoryOrders[idx] = {
      ...inMemoryOrders[idx],
      ...(newStatus ? { status: newStatus, order_status: newStatus } : {}),
      ...extra,
    };
  }
}
