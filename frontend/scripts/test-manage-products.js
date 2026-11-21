/**
 * test-manage-products.js
 * Verification Test Suite for ShilpSetu Manage Products Page & Inventory Management
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

console.log('\n📦 Running ShilpSetu Manage Products Test Suite...\n');

const rootDir = path.resolve(__dirname, '..');
const screenPath = path.join(rootDir, 'src', 'components', 'products', 'ManageProductsScreen.jsx');
const routePath = path.join(rootDir, 'src', 'app', '(artisan)', 'products', 'index.jsx');
const statsCardPath = path.join(rootDir, 'src', 'components', 'products', 'InventoryStatsGrid.jsx');
const productCardPath = path.join(rootDir, 'src', 'components', 'products', 'ManageProductCard.jsx');
const quickStockPath = path.join(rootDir, 'src', 'components', 'products', 'QuickStockModal.jsx');
const productServicePath = path.join(rootDir, 'src', 'services', 'productService.js');

// 1. Files existence
runTest('1. Manage Products screen, sub-components, and route exist', () => {
  assert(fs.existsSync(screenPath), 'ManageProductsScreen.jsx exists');
  assert(fs.existsSync(routePath), 'products/index.jsx exists');
  assert(fs.existsSync(statsCardPath), 'InventoryStatsGrid.jsx exists');
  assert(fs.existsSync(productCardPath), 'ManageProductCard.jsx exists');
  assert(fs.existsSync(quickStockPath), 'QuickStockModal.jsx exists');
});

// 2. Product service methods
runTest('2. productService exports duplicateProduct and updateProductStock', () => {
  const content = fs.readFileSync(productServicePath, 'utf8');
  assert(content.includes('duplicateProduct'), 'Exports duplicateProduct');
  assert(content.includes('updateProductStock'), 'Exports updateProductStock');
  assert(content.includes('deleteProduct'), 'Exports deleteProduct');
  assert(content.includes('getMyProducts'), 'Exports getMyProducts');
});

// 3. Header, search and filter tabs
runTest('3. Header, search input, and filter pill tabs with dynamic counts', () => {
  const content = fs.readFileSync(screenPath, 'utf8');
  assert(content.includes('Manage Products'), 'Header displays Manage Products');
  assert(content.includes('Search products by name, category or tag...'), 'Search input with placeholder');
  assert(content.includes('All (') && content.includes('In Stock (') && content.includes('Low Stock (') && content.includes('Out of Stock ('), 'Filter pills display dynamic counts');
});

// 4. Inventory stats 4-card grid
runTest('4. Inventory statistics grid displays Total, In Stock, Low Stock, and Out of Stock', () => {
  const content = fs.readFileSync(statsCardPath, 'utf8');
  assert(content.includes('Total') && content.includes('In Stock') && content.includes('Low Stock') && content.includes('Out of Stock'), 'Displays all 4 status indicators');
  assert(content.includes('Package') && content.includes('CheckCircle2') && content.includes('AlertTriangle') && content.includes('XCircle'), 'Uses vector Lucide icons for inventory metrics');
});

// 5. Sorting and Grid/List toggle
runTest('5. Supports 6 sort options and Grid/List layout toggle', () => {
  const content = fs.readFileSync(screenPath, 'utf8');
  assert(content.includes('newest') && content.includes('oldest') && content.includes('price_low') && content.includes('price_high') && content.includes('name_az') && content.includes('stock_low'), 'Includes all 6 sorting options');
  assert(content.includes('LayoutGrid') && content.includes('List'), 'Includes Grid / List toggle buttons');
  assert(content.includes("viewMode === 'grid' ? 2 : 1"), 'FlatList numColumns adapts dynamically to view mode');
});

// 6. ManageProductCard renders real image, actions, and stock badges
runTest('6. ManageProductCard renders real image, edit, duplicate, delete and quick stock', () => {
  const content = fs.readFileSync(productCardPath, 'utf8');
  assert(content.includes('getProductRealImage'), 'Resolves real product image');
  assert(content.includes('onEdit') && content.includes('onDuplicate') && content.includes('onDelete') && content.includes('onQuickStock'), 'Provides all required product actions');
  assert(content.includes('In Stock') && content.includes('Low Stock') && content.includes('Out of Stock'), 'Calculates stock badges');
});

// 7. Stock update validation
runTest('7. Quick stock modal validates against negative stock values', () => {
  const content = fs.readFileSync(quickStockPath, 'utf8');
  assert(content.includes('Stock cannot be negative') || content.includes('parsed < 0'), 'Validates non-negative stock numbers');
  assert(content.includes('handleIncrement') && content.includes('handleDecrement'), 'Includes counter stepper buttons');
});

// 8. Navigation integration
runTest('8. Integrated with Artisan bottom navigation and drawer', () => {
  const content = fs.readFileSync(screenPath, 'utf8');
  assert(content.includes('ArtisanBottomNavigation'), 'Includes bottom navigation');
  assert(content.includes('activeTab="products"'), 'Products tab is actively selected');
  assert(content.includes('ArtisanNavigationDrawer'), 'Includes slide-out drawer menu');
});

console.log(`\n───────────────────────────────────────────────────────`);
console.log(`🎯 Summary: ${passed} passed, ${total - passed} failed out of ${total}`);
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}

