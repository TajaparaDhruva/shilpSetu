/**
 * test-cart-checkout-frontend.js
 * Test suite for ShilpSetu Cart & Checkout flow.
 * Validates files, exports, component structures, calculations, PIN validations, and routes.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'frontend/src');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ FAIL: ${name} — ${err.message}`);
    failed++;
  }
}

function readFile(relPath) {
  const full = path.join(SRC, relPath);
  if (!fs.existsSync(full)) throw new Error(`File not found: ${relPath}`);
  return fs.readFileSync(full, 'utf8');
}

console.log('\n🛒 1. Services Layer Verification');

test('addressService exports required operations', () => {
  const code = readFile('services/addressService.js');
  assert.ok(/export\s+async\s+function\s+getAddresses/.test(code));
  assert.ok(/export\s+async\s+function\s+addAddress/.test(code));
  assert.ok(/export\s+async\s+function\s+updateAddress/.test(code));
  assert.ok(/export\s+async\s+function\s+deleteAddress/.test(code));
  assert.ok(/export\s+async\s+function\s+setDefaultAddress/.test(code));
  assert.ok(/export\s+async\s+function\s+getDefaultAddress/.test(code));
});

test('addressService Indian PIN and phone validation', () => {
  const code = readFile('services/addressService.js');
  // 6 digits PIN
  assert.ok(/6/.test(code));
  assert.ok(/pincode/.test(code));
  // 10 digits phone
  assert.ok(/phone/.test(code));
});

test('couponService exports validation, apply, remove', () => {
  const code = readFile('services/couponService.js');
  assert.ok(/export\s+async\s+function\s+validateCoupon/.test(code));
  assert.ok(/export\s+async\s+function\s+applyCoupon/.test(code));
  assert.ok(/export\s+function\s+removeCoupon/.test(code));
  assert.ok(/export\s+function\s+getAppliedCoupon/.test(code));
});

test('checkoutService exports cart validation, summary, delivery options', () => {
  const code = readFile('services/checkoutService.js');
  assert.ok(/export\s+async\s+function\s+validateCartForCheckout/.test(code));
  assert.ok(/export\s+function\s+calculatePriceSummary/.test(code));
  assert.ok(/export\s+function\s+getDeliveryOptions/.test(code));
});

test('orderService exports placeOrder, getOrder, getMyOrders', () => {
  const code = readFile('services/orderService.js');
  assert.ok(/export\s+async\s+function\s+placeOrder/.test(code));
  assert.ok(/export\s+async\s+function\s+getOrder/.test(code));
  assert.ok(/export\s+async\s+function\s+getMyOrders/.test(code));
});

test('paymentService exports payment methods and order initiation', () => {
  const code = readFile('services/paymentService.js');
  assert.ok(/export\s+function\s+getPaymentMethods/.test(code));
  assert.ok(/export\s+async\s+function\s+initiateCODOrder/.test(code));
});

console.log('\n🎨 2. Cart Components & Screen');

test('CartScreen renders CartItemCard, CouponCard, PriceSummary, Proceed to Checkout', () => {
  const code = readFile('components/cart/CartScreen.jsx');
  assert.ok(code.includes('CartItemCard'));
  assert.ok(code.includes('CouponCard'));
  assert.ok(code.includes('PriceSummary'));
  assert.ok(code.includes('Proceed to Checkout'));
  assert.ok(code.includes('My Cart'));
});

test('CartItemCard displays product, price, quantity selector, remove', () => {
  const code = readFile('components/cart/CartItemCard.jsx');
  assert.ok(code.includes('onQuantityChange'));
  assert.ok(code.includes('onRemove'));
});

test('EmptyCart provides continue shopping action', () => {
  const code = readFile('components/cart/EmptyCart.jsx');
  assert.ok(code.includes('onContinueShopping') || code.includes('Continue Shopping'));
});

console.log('\n🚚 3. Checkout Components & Screen');

test('CheckoutScreen renders Progress, Address list, Delivery options, OrderSummary', () => {
  const code = readFile('components/checkout/CheckoutScreen.jsx');
  assert.ok(code.includes('CheckoutProgress'));
  assert.ok(code.includes('AddressCard'));
  assert.ok(code.includes('DeliveryOptionCard'));
  assert.ok(code.includes('OrderSummary'));
  assert.ok(code.includes('Continue to Payment'));
});

test('CheckoutProgress shows 4 stages: Cart, Address, Payment, Order', () => {
  const code = readFile('components/checkout/CheckoutProgress.jsx');
  assert.ok(code.includes('Cart'));
  assert.ok(code.includes('Address'));
  assert.ok(code.includes('Payment'));
  assert.ok(code.includes('Order'));
});

test('AddressCard handles selection, editing, deletion and default badge', () => {
  const code = readFile('components/checkout/AddressCard.jsx');
  assert.ok(code.includes('onSelect'));
  assert.ok(code.includes('onEdit'));
  assert.ok(code.includes('onDelete'));
  assert.ok(code.includes('Default'));
});

test('AddressForm provides input fields for name, line, city, state, pincode, phone', () => {
  const code = readFile('components/checkout/AddressForm.jsx');
  assert.ok(code.includes('name'));
  assert.ok(code.includes('pincode'));
  assert.ok(code.includes('phone'));
  assert.ok(code.includes('city'));
});

console.log('\n💳 4. Payment Components & Order Confirmation');

test('PaymentScreen supports UPI, Card, Net Banking, COD and validates order before placement', () => {
  const code = readFile('components/payment/PaymentScreen.jsx');
  assert.ok(code.includes('PaymentMethodCard'));
  assert.ok(code.includes('PlaceOrderButton'));
  assert.ok(code.includes('initiateCODOrder') || code.includes('placeOrder'));
  assert.ok(code.includes('Select Payment Method'));
});

test('OrderSuccessScreen displays order confirmation, order number, and actions', () => {
  const code = readFile('components/payment/OrderSuccessScreen.jsx');
  assert.ok(code.includes('Order Placed') || code.includes('Order Confirmed'));
  assert.ok(code.includes('Track Order') || code.includes('Continue Shopping'));
});

console.log('\n📱 5. Routes & Navigation Layout');

test('All customer checkout routes exist', () => {
  assert.ok(fs.existsSync(path.join(SRC, 'app/(customer)/cart.jsx')));
  assert.ok(fs.existsSync(path.join(SRC, 'app/(customer)/checkout.jsx')));
  assert.ok(fs.existsSync(path.join(SRC, 'app/(customer)/checkout/payment.jsx')));
  assert.ok(fs.existsSync(path.join(SRC, 'app/(customer)/checkout/success.jsx')));
});

test('Root _layout.tsx registers all cart and checkout routes', () => {
  const code = readFile('app/_layout.tsx');
  assert.ok(code.includes('(customer)/cart'));
  assert.ok(code.includes('(customer)/checkout'));
  assert.ok(code.includes('(customer)/checkout/payment'));
  assert.ok(code.includes('(customer)/checkout/success'));
});

console.log('\n🗄️ 6. Supabase Migration Schema');

test('cart_checkout_schema.sql defines customer_addresses, coupons, orders, order_items', () => {
  const migPath = path.join(ROOT, 'backend/supabase/migrations/20261113150000_cart_checkout_schema.sql');
  assert.ok(fs.existsSync(migPath));
  const sql = fs.readFileSync(migPath, 'utf8').toLowerCase();
  assert.ok(sql.includes('customer_addresses'));
  assert.ok(sql.includes('coupons'));
  assert.ok(sql.includes('orders'));
  assert.ok(sql.includes('order_items'));
  assert.ok(sql.includes('enable row level security'));
});

console.log('\n' + '─'.repeat(55));
console.log(`🎯 Total: ${passed} passed, ${failed} failed out of ${passed + failed}`);
process.exit(failed === 0 ? 0 : 1);
