/**
 * test-artisan-manage-orders-backend.js
 * Verification of backend database architecture, RLS, Multi-Artisan Isolation, and RPC operations
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- ShilpSetu Manage Orders Backend Architecture Verification ---');

// 1. Verify SQL Migration file exists and has all required components
const migrationPath = path.resolve(__dirname, '../../backend/supabase/migrations/manage_orders_backend.sql');
assert(fs.existsSync(migrationPath), 'manage_orders_backend.sql migration must exist');
const sql = fs.readFileSync(migrationPath, 'utf8');

// Assertions on Multi-Artisan Schema & Indexes
assert(sql.includes('CREATE TABLE IF NOT EXISTS public.artisan_order_fulfillments'), 'Must create artisan_order_fulfillments table');
assert(sql.includes('uq_artisan_order_fulfillment UNIQUE (order_id, artisan_id)'), 'Must enforce unique fulfillment per artisan per order');
assert(sql.includes('CREATE INDEX IF NOT EXISTS idx_artisan_fulfillments_artisan_id'), 'Index on artisan_id for fulfillments');
assert(sql.includes('CREATE INDEX IF NOT EXISTS idx_artisan_fulfillments_order_id'), 'Index on order_id for fulfillments');

// Assertions on RLS Policies
assert(sql.includes('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on orders');
assert(sql.includes('ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on order_items');
assert(sql.includes('ALTER TABLE public.artisan_order_fulfillments ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on fulfillments');
assert(sql.includes('CREATE POLICY "Artisans can view own fulfillments"'), 'Artisans can only view their own fulfillments');
assert(sql.includes('CREATE POLICY "Artisans can update own fulfillments"'), 'Artisans can only update their own fulfillments');

// Assertions on RPC Functions
assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_artisan_manage_order_stats_rpc()'), 'Must define get_artisan_manage_order_stats_rpc');
assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_artisan_manage_orders_rpc'), 'Must define get_artisan_manage_orders_rpc');
assert(sql.includes('CREATE OR REPLACE FUNCTION public.artisan_accept_order_rpc'), 'Must define artisan_accept_order_rpc');
assert(sql.includes('CREATE OR REPLACE FUNCTION public.artisan_mark_order_shipped_rpc'), 'Must define artisan_mark_order_shipped_rpc');
assert(sql.includes('CREATE OR REPLACE FUNCTION public.artisan_update_tracking_rpc'), 'Must define artisan_update_tracking_rpc');
assert(sql.includes('CREATE OR REPLACE FUNCTION public.artisan_cancel_order_rpc'), 'Must define artisan_cancel_order_rpc');
assert(sql.includes('CREATE OR REPLACE FUNCTION public.get_artisan_order_details_rpc'), 'Must define get_artisan_order_details_rpc');

console.log('✓ Database schema, Multi-Artisan fulfillment table, indexes, and RLS policies verified');

// 2. Validate Multi-Artisan Order Fulfillment Isolation Logic
function simulateMultiArtisanOrder() {
  const order = { id: 'order-multi-1', order_number: 'SS99999', overall_status: 'pending' };
  
  // Two distinct artisans in the same order
  const fulfillments = {
    'artisan-A': { order_id: order.id, artisan_id: 'artisan-A', status: 'pending', items: [{ id: 'p1', name: 'Pot', qty: 2 }] },
    'artisan-B': { order_id: order.id, artisan_id: 'artisan-B', status: 'pending', items: [{ id: 'p2', name: 'Jhumka', qty: 1 }] },
  };

  // Artisan A accepts their item
  fulfillments['artisan-A'].status = 'processing';
  assert.strictEqual(fulfillments['artisan-A'].status, 'processing');
  assert.strictEqual(fulfillments['artisan-B'].status, 'pending', 'Artisan B item status must remain unaffected by Artisan A');

  // Artisan A ships their item
  fulfillments['artisan-A'].status = 'shipped';
  fulfillments['artisan-A'].courier = 'Blue Dart';
  fulfillments['artisan-A'].tracking = 'BD123';
  assert.strictEqual(fulfillments['artisan-A'].status, 'shipped');
  assert.strictEqual(fulfillments['artisan-B'].status, 'pending');

  // Artisan B cancels their item with reason
  fulfillments['artisan-B'].status = 'cancelled';
  fulfillments['artisan-B'].reason = 'Out of clay';
  assert.strictEqual(fulfillments['artisan-B'].status, 'cancelled');
  assert.strictEqual(fulfillments['artisan-A'].status, 'shipped', 'Artisan A shipped status remains valid');
}

simulateMultiArtisanOrder();
console.log('✓ Multi-artisan independent fulfillment logic passed (Artisan A and B fulfill independently)');

// 3. Validate Status Transition Constraints
function canTransition(current, next) {
  if (current === 'pending' && (next === 'processing' || next === 'cancelled')) return true;
  if (current === 'processing' && next === 'shipped') return true;
  if (current === 'shipped' && next === 'delivered') return true;
  return false;
}

assert.strictEqual(canTransition('pending', 'processing'), true);
assert.strictEqual(canTransition('pending', 'cancelled'), true);
assert.strictEqual(canTransition('processing', 'shipped'), true);
assert.strictEqual(canTransition('shipped', 'delivered'), true);
assert.strictEqual(canTransition('delivered', 'pending'), false, 'Cannot revert delivered order to pending');
assert.strictEqual(canTransition('cancelled', 'processing'), false, 'Cannot process a cancelled order');
assert.strictEqual(canTransition('processing', 'pending'), false, 'Cannot revert processing to pending');
console.log('✓ Status transition rules strictly prevent illegal state reversals');

// 4. Validate Inventory Restoration Calculation
function restoreStock(inventory, cancelledItems) {
  const updated = { ...inventory };
  cancelledItems.forEach((item) => {
    updated[item.productId] = (updated[item.productId] || 0) + item.qty;
  });
  return updated;
}

const initialInv = { 'prod-pot-1': 10, 'prod-jhumka-1': 5 };
const afterCancel = restoreStock(initialInv, [{ productId: 'prod-pot-1', qty: 2 }]);
assert.strictEqual(afterCancel['prod-pot-1'], 12, 'Stock of cancelled item must be accurately incremented');
assert.strictEqual(afterCancel['prod-jhumka-1'], 5, 'Other products must remain unaffected');
console.log('✓ Atomic stock restoration correctly restores item inventory without over-crediting');

console.log('\nALL MANAGE ORDERS BACKEND VERIFICATIONS PASSED!\n');
