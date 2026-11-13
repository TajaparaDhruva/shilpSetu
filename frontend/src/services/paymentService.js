/**
 * paymentService.js — Payment Methods & Processing for ShilpSetu
 *
 * Handles COD orders directly and provides a placeholder for online
 * payment gateway integration (UPI, Card, NetBanking).
 *
 * SECURITY: This service never stores card numbers, CVV, UPI PIN,
 * or any raw payment credentials. All sensitive data must go through
 * a PCI-compliant payment gateway.
 */

import { placeOrder } from './orderService.js';

// ─── Payment Methods ──────────────────────────────────────────────────────────

/**
 * All supported payment methods
 */
export const FALLBACK_PAYMENT_METHODS = [
  {
    id: 'upi',
    label: 'UPI',
    description: 'Pay using any UPI app',
    icon: 'upi',
    subOptions: [
      { id: 'gpay', label: 'Google Pay' },
      { id: 'phonepe', label: 'PhonePe' },
      { id: 'paytm', label: 'Paytm' },
      { id: 'other', label: 'Other UPI' },
    ],
    available: true,
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    description: 'Visa, Mastercard, RuPay',
    icon: 'card',
    subOptions: [],
    available: true,
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    description: 'All major banks supported',
    icon: 'bank',
    subOptions: [],
    available: true,
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay in cash when your order arrives',
    icon: 'cod',
    subOptions: [],
    available: true,
  },
];

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Get all supported payment methods
 * @returns {Array}
 */
export function getPaymentMethods() {
  return FALLBACK_PAYMENT_METHODS;
}

/**
 * Place a Cash on Delivery order directly
 * @param {Object} orderData - Same shape as placeOrder's orderData
 * @returns {Promise<{ success: boolean, orderId?: string, orderNumber?: string, paymentStatus?: string, error?: string }>}
 */
export async function initiateCODOrder(orderData) {
  const result = await placeOrder({
    ...orderData,
    paymentMethod: 'cod',
  });

  if (!result.success) {
    return { success: false, error: result.error || 'Failed to place COD order' };
  }

  return {
    success: true,
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    paymentStatus: 'cod_pending',
    message: 'Order placed successfully! Pay on delivery.',
  };
}

/**
 * Initiate an online payment (placeholder — gateway not yet integrated)
 * @param {string} method - 'upi' | 'card' | 'netbanking'
 * @param {Object} orderData
 * @returns {{ success: false, message: string, requiresGateway: true }}
 *
 * NOTE: This intentionally does NOT store any card/UPI credentials.
 *       Real integration should use a PCI-compliant gateway (Razorpay, Cashfree, etc.)
 *       and tokenise all payment details server-side.
 */
export function initiatOnlinePayment(method, orderData) {
  return {
    success: false,
    message: 'Online payment gateway integration pending. Use COD for now.',
    requiresGateway: true,
    method,
  };
}

/**
 * Get the payment status of an order from the DB
 * (Convenience wrapper — delegates to orderService via REST)
 * @param {string} orderId
 * @returns {Promise<{ success: boolean, paymentStatus?: string, error?: string }>}
 */
export async function getPaymentStatus(orderId) {
  const { getAccessToken } = await import('./auth.js');
  const { getCurrentUser } = await import('./auth.js');

  const token = getAccessToken();
  const user = await getCurrentUser();

  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!user || !token || !SUPABASE_URL) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&user_id=eq.${user.id}&select=id,payment_status`,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      return { success: false, error: 'Failed to fetch payment status' };
    }

    const rows = await res.json();
    const order = Array.isArray(rows) ? rows[0] : null;

    if (!order) return { success: false, error: 'Order not found' };

    return { success: true, paymentStatus: order.payment_status };
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
}
