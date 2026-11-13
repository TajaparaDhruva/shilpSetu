/**
 * Comprehensive Automated Test Suite for ShilpSetu Artisan Dashboard Backend
 * Validates all 16 prompt requirements
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

console.log('\n--- ShilpSetu Artisan Dashboard Backend Test Suite ---\n');

const MIGRATION_PATH = path.resolve(__dirname, '../../backend/supabase/migrations/20261113180000_artisan_dashboard_backend.sql');
const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

// 1. Retrieve Authenticated Artisan Profile
runTest('1. Migration defines get_artisan_dashboard_profile_rpc with auth.uid() check', () => {
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_artisan_dashboard_profile_rpc'), 'Missing get_artisan_dashboard_profile_rpc');
  assert(sql.includes('v_user_id := auth.uid();'), 'Must use authenticated Supabase user identity');
  assert(sql.includes('craft_specialization'), 'Must return craft specialization');
});

// 2. Active Product Count
runTest('2. Migration calculates active and inactive product count', () => {
  assert(sql.includes("COUNT(*) FILTER (WHERE is_active = true)"), 'Must count active products');
  assert(sql.includes("COUNT(*) FILTER (WHERE is_active = false)"), 'Must count inactive products');
});

// 3-4. Total Orders and Distinct Counting
runTest('3 & 4. Migration counts DISTINCT orders for the artisan products', () => {
  assert(sql.includes('COUNT(DISTINCT oi.order_id)'), 'Must count distinct orders, not order items');
  assert(sql.includes('oi.artisan_id = v_user_id'), 'Must filter by artisan_id');
});

// 5-6. Actual Eligible Earnings & Exclusion of Cancelled/Refunded Orders
runTest('5 & 6. Migration calculates net earnings and excludes cancelled/refunded orders', () => {
  assert(sql.includes("o.order_status NOT IN ('cancelled', 'refunded')"), 'Must exclude cancelled and refunded orders');
  assert(sql.includes('v_net_earnings := ROUND(v_gross_sales * (1.0 - v_commission_rate), 2);'), 'Must calculate eligible net sales after commission');
  assert(sql.includes('v_pending_payout := GREATEST(0, v_net_earnings - v_paid_payouts);'), 'Must calculate pending payout amount');
});

// 7-8. Average Rating & Zero Reviews Handling
runTest('7 & 8. Migration calculates average rating from published reviews and handles zero reviews', () => {
  assert(sql.includes('AVG(r.rating)'), 'Must calculate average rating');
  assert(sql.includes('r.is_published = true'), 'Must only include published reviews');
  assert(sql.includes('COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0)'), 'Must return 0.0 when zero reviews exist');
});

// 9-11. Recent Orders & Access Prevention
runTest('9, 10 & 11. Migration defines get_artisan_recent_orders_rpc with limit and product snapshots', () => {
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_artisan_recent_orders_rpc'), 'Missing get_artisan_recent_orders_rpc');
  assert(sql.includes('LIMIT p_limit'), 'Must support configurable limit');
  assert(sql.includes('product_name_snapshot'), 'Must use historical product snapshot');
  assert(sql.includes('oi.artisan_id = v_user_id OR p.artisan_id = v_user_id'), 'Must only return authenticated artisan items');
});

// 12. Artisan Order Workflow Status Counts
runTest('12. Migration defines get_artisan_order_counts_rpc for status breakdown', () => {
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_artisan_order_counts_rpc'), 'Missing get_artisan_order_counts_rpc');
  assert(sql.includes("COUNT(DISTINCT o.id) FILTER (WHERE o.order_status = 'processing')"), 'Must count processing orders');
  assert(sql.includes("COUNT(DISTINCT o.id) FILTER (WHERE o.order_status = 'packed')"), 'Must count packed orders');
  assert(sql.includes("COUNT(DISTINCT o.id) FILTER (WHERE o.order_status IN ('shipped', 'out_for_delivery'))"), 'Must count shipped orders');
});

// 13-14. Artisan Notification Integration
runTest('13 & 14. Notifications table and read RPC created', () => {
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.notifications'), 'Missing notifications table');
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_artisan_notifications_rpc'), 'Missing get_artisan_notifications_rpc');
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.mark_notification_read_rpc'), 'Missing mark_notification_read_rpc');
});

// 15-16. Row Level Security & Financial Protection
runTest('15 & 16. RLS enabled on notifications, payouts and secure RPC execution', () => {
  assert(sql.includes('ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;'), 'RLS must be enabled on notifications');
  assert(sql.includes('ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;'), 'RLS must be enabled on payouts');
  assert(sql.includes('notifications_select_own'), 'Must restrict notification access to owner');
  assert(sql.includes('payouts_select_own'), 'Must restrict payout records to owner');
  assert(sql.includes('SECURITY DEFINER'), 'RPCs must run as SECURITY DEFINER');
});

// 17. Service Layer Functions Verification
runTest('17. artisanDashboardService exports all required functions', () => {
  const serviceCode = fs.readFileSync(path.resolve(__dirname, '../src/services/artisanDashboardService.js'), 'utf8');
  assert(serviceCode.includes('export async function getArtisanDashboardProfile'), 'Missing getArtisanDashboardProfile');
  assert(serviceCode.includes('export async function getArtisanDashboardStats'), 'Missing getArtisanDashboardStats');
  assert(serviceCode.includes('export async function getArtisanRecentOrders'), 'Missing getArtisanRecentOrders');
  assert(serviceCode.includes('export async function getArtisanOrderCounts'), 'Missing getArtisanOrderCounts');
});

// 18. Notification Service Layer Functions Verification
runTest('18. notificationService exports all required notification operations', () => {
  const notifCode = fs.readFileSync(path.resolve(__dirname, '../src/services/notificationService.js'), 'utf8');
  assert(notifCode.includes('export async function getArtisanNotifications'), 'Missing getArtisanNotifications');
  assert(notifCode.includes('export async function getUnreadNotificationCount'), 'Missing getUnreadNotificationCount');
  assert(notifCode.includes('export async function markNotificationAsRead'), 'Missing markNotificationAsRead');
});

console.log(`\nTests finished: ${testsPassed} passed, ${testsFailed} failed.\n`);
if (testsFailed > 0) process.exit(1);

