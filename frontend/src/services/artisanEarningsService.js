/**
 * artisanEarningsService.js — Backend service for Artisan Earnings & Financial Analytics
 *
 * Implements:
 * - getArtisanEarningsAnalytics(period): Retrieves real dynamic financial stats, growth %, and monthly chart series
 * - getArtisanTransactions(limit, offset): Retrieves real transaction history with pagination
 *
 * STRICTLY NO DUMMY DATA: Returns 0s and empty lists when no orders exist.
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

export const PERIOD_FILTERS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3_months', label: 'Last 3 Months' },
  { id: 'this_year', label: 'This Year' },
];

/**
 * 1. Fetch Dynamic Earnings Analytics based on selected period filter
 */
export async function getArtisanEarningsAnalytics(period = 'this_month') {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_artisan_earnings_analytics_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ p_period: period }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return {
            period: data.period || period,
            totalEarnings: data.total_earnings ?? 0,
            priorEarnings: data.prior_earnings ?? 0,
            growthPercentage: data.growth_percentage ?? 0,
            isGrowth: data.is_growth ?? true,
            totalOrders: data.total_orders ?? 0,
            productsSold: data.products_sold ?? 0,
            averageRating: data.average_rating ?? 0.0,
            totalReviews: data.total_reviews ?? 0,
            averageOrderValue: data.average_order_value ?? 0,
            chartPoints: Array.isArray(data.chart_points) ? data.chart_points : [],
            recentTransactions: Array.isArray(data.recent_transactions) ? data.recent_transactions : [],
          };
        }
      }
    } catch (err) {
      console.warn('getArtisanEarningsAnalytics RPC error:', err.message);
    }
  }

  // Pure zero-fallback when unauthenticated or empty database
  return {
    period,
    totalEarnings: 0,
    priorEarnings: 0,
    growthPercentage: 0,
    isGrowth: true,
    totalOrders: 0,
    productsSold: 0,
    averageRating: 0.0,
    totalReviews: 0,
    averageOrderValue: 0,
    chartPoints: [],
    recentTransactions: [],
  };
}

/**
 * 2. Fetch Paginated Transactions List
 */
export async function getArtisanTransactions(limit = 20, offset = 0) {
  const token = getAccessToken();
  const user = await getCurrentUser();

  if (user && token && SUPABASE_URL) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_artisan_transactions_rpc`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ p_limit: limit, p_offset: offset }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.transactions)) {
          return {
            total: data.total ?? data.transactions.length,
            transactions: data.transactions,
          };
        }
      }
    } catch (err) {
      console.warn('getArtisanTransactions RPC error:', err.message);
    }
  }

  return { total: 0, transactions: [] };
}
