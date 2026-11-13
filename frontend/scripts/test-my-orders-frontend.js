/**
 * Comprehensive Test Suite for ShilpSetu My Orders Frontend
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

console.log('\n--- ShilpSetu My Orders Frontend Test Suite ---\n');

// 1. Check Component Files Exist
runTest('All Orders components exist', () => {
  const compDir = path.resolve(__dirname, '../src/components/orders');
  const requiredFiles = [
    'OrderCard.jsx',
    'OrderFilterTabs.jsx',
    'OrderReviewForm.jsx',
    'OrderStatusBadge.jsx',
    'OrderTrackingTimeline.jsx',
    'EmptyOrders.jsx',
    'OrderPriceSummary.jsx',
    'OrderProductInfo.jsx',
    'MyOrdersScreen.jsx',
    'OrderDetailsScreen.jsx',
  ];
  requiredFiles.forEach((file) => {
    assert(fs.existsSync(path.join(compDir, file)), `Missing file: ${file}`);
  });
});

// 2. Check Routes Exist
runTest('Customer order routes exist', () => {
  const routesDir = path.resolve(__dirname, '../src/app/(customer)');
  assert(fs.existsSync(path.join(routesDir, 'orders.jsx')), 'Missing orders.jsx');
  assert(fs.existsSync(path.join(routesDir, 'orders/[id].jsx')), 'Missing orders/[id].jsx');
});

// 3. Verify _layout.tsx Registration
runTest('_layout.tsx registers (customer)/orders and (customer)/orders/[id]', () => {
  const layoutPath = path.resolve(__dirname, '../src/app/_layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');
  assert(content.includes('name="(customer)/orders"'), 'Missing (customer)/orders route in layout');
  assert(content.includes('name="(customer)/orders/[id]"'), 'Missing (customer)/orders/[id] route in layout');
});

// 4. Verify Theme Colors in Order Components
runTest('Orders components conform to ShilpSetu Theme Palette', () => {
  const badgeFile = path.resolve(__dirname, '../src/components/orders/OrderStatusBadge.jsx');
  const badgeContent = fs.readFileSync(badgeFile, 'utf8');
  assert(badgeContent.includes('#DCE8B5'), 'Badge must include success green #DCE8B5');
  assert(badgeContent.includes('#F9D8D0'), 'Badge must include cancelled red #F9D8D0');

  const cardFile = path.resolve(__dirname, '../src/components/orders/OrderCard.jsx');
  const cardContent = fs.readFileSync(cardFile, 'utf8');
  assert(cardContent.includes('#FBF5EB'), 'Card must have #FBF5EB background');
  assert(cardContent.includes('#E5D7C5'), 'Card must have #E5D7C5 border');
});

// 5. Verify Filter Tabs Mapping
runTest('OrderFilterTabs contains all required status tabs', () => {
  const filterFile = path.resolve(__dirname, '../src/components/orders/OrderFilterTabs.jsx');
  const content = fs.readFileSync(filterFile, 'utf8');
  const expectedTabs = ['All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  expectedTabs.forEach((tab) => {
    assert(content.includes(tab), `OrderFilterTabs missing tab: ${tab}`);
  });
});

// 6. Verify 4-Stage Tracking Timeline
runTest('OrderTrackingTimeline contains all 4 tracking stages', () => {
  const timelineFile = path.resolve(__dirname, '../src/components/orders/OrderTrackingTimeline.jsx');
  const content = fs.readFileSync(timelineFile, 'utf8');
  const expectedStages = ['Ordered', 'Packed', 'Out for Delivery', 'Delivered'];
  expectedStages.forEach((stage) => {
    assert(content.includes(stage), `OrderTrackingTimeline missing stage: ${stage}`);
  });
});

// 7. Verify Order Service Implementation
runTest('orderService provides all required order and cancellation methods', () => {
  const serviceFile = path.resolve(__dirname, '../src/services/orderService.js');
  const content = fs.readFileSync(serviceFile, 'utf8');
  assert(content.includes('export async function getCustomerOrders'), 'Missing getCustomerOrders');
  assert(content.includes('export async function getMyOrders'), 'Missing getMyOrders');
  assert(content.includes('export async function getOrderDetails'), 'Missing getOrderDetails');
  assert(content.includes('export async function cancelOrder'), 'Missing cancelOrder');
  assert(content.includes('FALLBACK_ORDERS'), 'Missing FALLBACK_ORDERS');
  assert(content.includes('SS10456'), 'Missing fallback SS10456');
  assert(content.includes('SS10421'), 'Missing fallback SS10421');
  assert(content.includes('SS10398'), 'Missing fallback SS10398');
});

// 8. Verify Review Service & Modal Connection
runTest('OrderReviewForm connects to reviewService', () => {
  const reviewFile = path.resolve(__dirname, '../src/components/orders/OrderReviewForm.jsx');
  const content = fs.readFileSync(reviewFile, 'utf8');
  assert(content.includes('submitProductReview'), 'OrderReviewForm must call submitProductReview');
  assert(content.includes('rating'), 'OrderReviewForm must handle rating');
  assert(content.includes('comment'), 'OrderReviewForm must handle comment');
});

// 9. Verify Navigation Wiring in Customer Bottom Navigation
runTest('CustomerBottomNavigation routes to orders', () => {
  const navFile = path.resolve(__dirname, '../src/components/customer/CustomerBottomNavigation.jsx');
  const content = fs.readFileSync(navFile, 'utf8');
  assert(content.includes("key: 'orders'"), 'Missing orders tab in TABS');
});

console.log(`\nTests finished: ${testsPassed} passed, ${testsFailed} failed.\n`);
if (testsFailed > 0) process.exit(1);

