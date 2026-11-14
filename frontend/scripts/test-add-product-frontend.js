/**
 * Comprehensive Automated Test Suite for ShilpSetu Add Product Frontend
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

console.log('\n--- ShilpSetu Add Product Frontend Test Suite ---\n');

const COMP_DIR = path.resolve(__dirname, '../src/components/products');
const SERVICE_PATH = path.resolve(__dirname, '../src/services/productService.js');

// 1. Components exist
runTest('1. All required Add Product components exist in src/components/products/', () => {
  const files = [
    'AddProductScreen.jsx',
    'ProductImagePicker.jsx',
    'ProductFormInput.jsx',
    'ProductCategoryPicker.jsx',
    'ProductPriceStockInput.jsx',
    'ProductTagSelector.jsx',
  ];
  files.forEach((file) => {
    assert(fs.existsSync(path.join(COMP_DIR, file)), `Missing component: ${file}`);
  });
});

// 2. Route exists and registered
runTest('2. Route src/app/(artisan)/products/add.jsx exists and registered in _layout.tsx', () => {
  const routePath = path.resolve(__dirname, '../src/app/(artisan)/products/add.jsx');
  assert(fs.existsSync(routePath), 'Missing add.jsx route file');

  const layout = fs.readFileSync(path.resolve(__dirname, '../src/app/_layout.tsx'), 'utf8');
  assert(layout.includes('name="(artisan)/products/add"'), '_layout.tsx must register (artisan)/products/add');
});

// 3. Product Image Picker
runTest('3. ProductImagePicker supports up to 5 images, gallery picking, and removal', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ProductImagePicker.jsx'), 'utf8');
  assert(content.includes('ImagePicker'), 'Must import ImagePicker');
  assert(content.includes('maxImages = 5') || content.includes('maxImages'), 'Must support max 5 images limit');
  assert(content.includes('launchImageLibraryAsync'), 'Must launch gallery picker');
  assert(content.includes('handleRemoveImage'), 'Must allow removing selected images');
  assert(content.includes('Product Images'), 'Must have heading Product Images *');
});

// 4. Form Inputs & Character Counter
runTest('4. ProductFormInput & AddProductScreen enforce 300 char description count', () => {
  const screenContent = fs.readFileSync(path.join(COMP_DIR, 'AddProductScreen.jsx'), 'utf8');
  assert(screenContent.includes('description.length}/300') || screenContent.includes('/300'), 'Must show live character count /300');
  assert(screenContent.includes('maxLength={300}'), 'Must cap input at 300 characters');
  assert(screenContent.includes('Product Name'), 'Must have Product Name field');
  assert(screenContent.includes('Category'), 'Must have Category selector');
});

// 5. Price & Stock side-by-side
runTest('5. ProductPriceStockInput renders price (₹) and stock side-by-side', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ProductPriceStockInput.jsx'), 'utf8');
  assert(content.includes('Price (₹)'), 'Missing Price (₹) label');
  assert(content.includes('Stock'), 'Missing Stock label');
  assert(content.includes('numeric'), 'Numeric keyboard input required');
});

// 6. Category dropdown options
runTest('6. ProductCategoryPicker includes all standard initial craft categories', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ProductCategoryPicker.jsx'), 'utf8');
  const expectedCats = [
    'Pottery & Ceramics',
    'Textiles & Handlooms',
    'Jewellery',
    'Woodcrafts',
    'Home Decor',
    'Paintings',
    'Accessories',
  ];
  expectedCats.forEach((cat) => {
    assert(content.includes(cat), `Missing category: ${cat}`);
  });
});

// 7. Product Tags Selector
runTest('7. ProductTagSelector handles chips, removal, and custom modal addition', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ProductTagSelector.jsx'), 'utf8');
  assert(content.includes('Product Tags'), 'Must display Product Tags heading');
  assert(content.includes('Handmade'), 'Must include default suggested tags');
  assert(content.includes('+ Add Tag'), 'Must have + Add Tag button');
  assert(content.includes('handleRemoveTag'), 'Must allow chip removal');
});

// 8. Backend integration in productService.js
runTest('8. productService.js exports createProduct, uploadProductImages, getProductCategories', () => {
  const service = fs.readFileSync(SERVICE_PATH, 'utf8');
  assert(service.includes('export async function createProduct'), 'Missing createProduct export');
  assert(service.includes('export async function uploadProductImages'), 'Missing uploadProductImages export');
  assert(service.includes('export async function getProductCategories'), 'Missing getProductCategories export');
});

// 9. Dashboard navigation integration
runTest('9. Artisan Dashboard routes to (artisan)/products/add on Add Product action', () => {
  const dashContent = fs.readFileSync(path.resolve(__dirname, '../src/components/artisan-dashboard/ArtisanDashboardScreen.jsx'), 'utf8');
  assert(dashContent.includes('/(artisan)/products/add'), 'Artisan dashboard must route to products/add');
});

console.log(`\nTests finished: ${testsPassed} passed, ${testsFailed} failed.\n`);
if (testsFailed > 0) process.exit(1);

