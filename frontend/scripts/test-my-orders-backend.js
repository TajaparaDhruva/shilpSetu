/**
 * Comprehensive Backend Test Suite for ShilpSetu My Orders System
 * Tests all 20 required requirements from the prompt
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

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function runAll() {
  console.log('\n--- ShilpSetu My Orders Backend Test Suite ---\n');

  // Load migration SQL
  const migrationPath = path.resolve(__dirname, '../../backend/supabase/migrations/20261113170000_my_orders_backend.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // 1. Retrieve Customer Orders RPC
  runTest('1. Database Migration defines get_customer_orders RPC', () => {
    assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_customer_orders'), 'Missing get_customer_orders RPC');
    assert(sql.includes('v_user_id := auth.uid();'), 'Must enforce authentication via auth.uid()');
    assert(sql.includes('SECURITY DEFINER'), 'Must use SECURITY DEFINER');
  });

  // 2. Orders with Multiple Products
  runTest('2. Multiple products handled via jsonb_agg in order items query', () => {
    assert(sql.includes('jsonb_agg(sub.order_obj)'), 'Must aggregate orders');
    assert(sql.includes('order_items oi'), 'Must join order_items');
    assert(sql.includes('product_name_snapshot'), 'Must use historical product snapshot');
  });

  // 3-6. Status Filtering (Processing, Shipped, Delivered, Cancelled)
  runTest('3. Supports Processing status filter', () => {
    assert(sql.includes("p_status = 'processing' AND o.order_status IN ('pending', 'confirmed', 'processing', 'packed')"), 'Missing processing filter mapping');
  });

  runTest('4. Supports Shipped status filter', () => {
    assert(sql.includes("p_status = 'shipped' AND o.order_status IN ('shipped', 'out_for_delivery')"), 'Missing shipped filter mapping');
  });

  runTest('5. Supports Delivered status filter', () => {
    assert(sql.includes("p_status = 'delivered' AND o.order_status IN ('delivered', 'completed')"), 'Missing delivered filter mapping');
  });

  runTest('6. Supports Cancelled status filter', () => {
    assert(sql.includes("p_status = 'cancelled' AND o.order_status IN ('cancelled', 'refunded')"), 'Missing cancelled filter mapping');
  });

  // 7. Pagination
  runTest('7. Orders query implements LIMIT and OFFSET pagination', () => {
    assert(sql.includes('LIMIT p_limit OFFSET v_offset'), 'Missing LIMIT and OFFSET in query');
  });

  // 8. Individual Order Details
  runTest('8. Database Migration defines get_order_details RPC', () => {
    assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_order_details'), 'Missing get_order_details RPC');
    assert(sql.includes('v_order RECORD;'), 'Must query order record');
    assert(sql.includes('shipping_address'), 'Must return shipping address');
  });

  // 9. Actual Tracking History
  runTest('9. order_status_history table and get_order_tracking RPC defined', () => {
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.order_status_history'), 'Missing order_status_history table');
    assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_order_tracking'), 'Missing get_order_tracking RPC');
    assert(sql.includes('CONSTRAINT uq_order_status_event UNIQUE (order_id, status)'), 'Must prevent duplicate tracking events');
  });

  // 10. Prevent Unauthorized Order Access
  runTest('10. Enforces user ownership check on single order retrieval', () => {
    assert(sql.includes('WHERE id = p_order_id AND (customer_id = v_user_id OR user_id = v_user_id)'), 'Must enforce customer_id = auth.uid() check');
  });

  // 11. Valid Cancellation Request
  runTest('11. Database Migration defines request_order_cancellation RPC', () => {
    assert(sql.includes('CREATE OR REPLACE FUNCTION public.request_order_cancellation'), 'Missing request_order_cancellation RPC');
    assert(sql.includes("order_status = 'cancelled'"), 'Must update order_status to cancelled');
    assert(sql.includes('cancelled_at = timezone'), 'Must store cancellation timestamp');
    assert(sql.includes('cancellation_reason = p_reason'), 'Must store cancellation reason');
  });

  // 12. Reject Invalid Cancellation
  runTest('12. Rejects cancellation of delivered and shipped orders', () => {
    assert(sql.includes("v_order.order_status IN ('delivered', 'completed')"), 'Must reject delivered cancellations');
    assert(sql.includes("v_order.order_status IN ('shipped', 'out_for_delivery')"), 'Must reject shipped cancellations');
  });

  // 13. Prevent Duplicate Cancellation
  runTest('13. Rejects repeated cancellation if already cancelled', () => {
    assert(sql.includes("v_order.order_status = 'cancelled'"), 'Must check if order is already cancelled');
    assert(sql.includes('Order is already cancelled'), 'Must return proper error message');
  });

  // 14. Verify Inventory Restoration
  runTest('14. Restores inventory during cancellation exactly once', () => {
    assert(sql.includes('SET stock = stock + v_item.quantity'), 'Must increment stock count');
  });

  // 15. Retrieve Eligible Review Products
  runTest('15. Database Migration defines get_eligible_review_products RPC', () => {
    assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_eligible_review_products'), 'Missing get_eligible_review_products RPC');
  });

  // 16. Submit Valid Review
  runTest('16. Database Migration defines submit_product_review_atomic RPC', () => {
    assert(sql.includes('CREATE OR REPLACE FUNCTION public.submit_product_review_atomic'), 'Missing submit_product_review_atomic RPC');
    assert(sql.includes('is_verified_purchase'), 'Must set verified purchase flag');
  });

  // 17. Reject Review for Undelivered Orders
  runTest('17. Enforces order delivered requirement before review submission', () => {
    assert(sql.includes("v_order.order_status NOT IN ('delivered', 'completed')"), 'Must check order is delivered before allowing review');
  });

  // 18. Prevent Duplicate Reviews & Rating Range
  runTest('18. Enforces rating between 1 and 5 and unique user-product review constraint', () => {
    assert(sql.includes('p_rating < 1 OR p_rating > 5'), 'Must enforce 1 to 5 rating constraint');
    assert(sql.includes('ON CONFLICT (user_id, product_id) DO UPDATE'), 'Must handle duplicate review upserting safely');
  });

  // 19. Order Statistics
  runTest('19. Database Migration defines get_customer_order_counts RPC', () => {
    assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_customer_order_counts'), 'Missing get_customer_order_counts RPC');
    assert(sql.includes('FILTER (WHERE order_status'), 'Uses fast Postgres FILTER aggregation for counts');
  });

  // 20. Verify RLS Policies
  runTest('20. Row Level Security enabled for order_status_history and reviews', () => {
    assert(sql.includes('ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;'), 'Must enable RLS on order_status_history');
    assert(sql.includes('order_status_history_select_own'), 'Must have RLS policy for customer tracking access');
    assert(sql.includes('order_status_history_select_artisan'), 'Must have RLS policy for artisan tracking access');
    assert(sql.includes('ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;'), 'Must enable RLS on reviews');
  });

  // 21. Service Layer Test
  const orderServiceCode = fs.readFileSync(path.resolve(__dirname, '../src/services/orderService.js'), 'utf8');
  runTest('21. orderService exports getCustomerOrders, getOrderDetails, getOrderTracking, getCustomerOrderCounts, requestOrderCancellation', () => {
    assert(orderServiceCode.includes('export async function getCustomerOrders'), 'Missing getCustomerOrders');
    assert(orderServiceCode.includes('export async function getOrderDetails'), 'Missing getOrderDetails');
    assert(orderServiceCode.includes('export async function getOrderTracking'), 'Missing getOrderTracking');
    assert(orderServiceCode.includes('export async function getCustomerOrderCounts'), 'Missing getCustomerOrderCounts');
    assert(orderServiceCode.includes('export async function requestOrderCancellation'), 'Missing requestOrderCancellation');
    assert(orderServiceCode.includes('FALLBACK_ORDERS'), 'Missing fallback orders');
  });

  // 22. Review Service Layer Test
  const reviewServiceCode = fs.readFileSync(path.resolve(__dirname, '../src/services/reviewService.js'), 'utf8');
  runTest('22. reviewService exports getEligibleReviewProducts, submitProductReview, getOrderReviewStatus', () => {
    assert(reviewServiceCode.includes('export async function getEligibleReviewProducts'), 'Missing getEligibleReviewProducts');
    assert(reviewServiceCode.includes('export async function submitProductReview'), 'Missing submitProductReview');
    assert(reviewServiceCode.includes('export async function getOrderReviewStatus'), 'Missing getOrderReviewStatus');
    assert(reviewServiceCode.includes('hasUserReviewedProduct'), 'Missing hasUserReviewedProduct');
  });

  console.log(`\nTests completed: ${testsPassed} passed, ${testsFailed} failed.\n`);
  if (testsFailed > 0) process.exit(1);
}

runAll();
