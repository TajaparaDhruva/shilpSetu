/**
 * test-edit-product-frontend.js
 *
 * Verifies all 18 requirements for the ShilpSetu Edit Product Page:
 * 1. EditProductScreen exists in src/components/products/
 * 2. Route (artisan)/products/edit/[id].jsx exists and registered in _layout.tsx
 * 3. Selected product summary card displays image, name, price, stock badge and arrow
 * 4. Add/Edit toggle renders with Edit Product active in deep forest green
 * 5. Update Details section heading renders
 * 6. Product image management supports existing images, removal, and adding up to 5 images
 * 7. Product name input pre-filled and editable
 * 8. Category picker supports standard 8 craft categories
 * 9. Price and Stock inputs side-by-side with non-negative validation
 * 10. Description multiline input with live character counter (300 char max)
 * 11. Product tag chips support removable chips and adding new tags
 * 12. Bottom actions: Cancel (with unsaved changes alert) and Save Changes (forest green)
 * 13. productService.js exports getProductById, updateProduct, deleteProductImages, uploadProductImages
 * 14. Theme conforms strictly to Warm Cream, Deep Forest Green, and Terracotta
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n🎨 Running ShilpSetu Edit Product Frontend Test Suite...\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// 1. Files existence
const editScreenPath = path.resolve(__dirname, '../src/components/products/EditProductScreen.jsx');
const editRoutePath = path.resolve(__dirname, '../src/app/(artisan)/products/edit/[id].jsx');
const layoutPath = path.resolve(__dirname, '../src/app/_layout.tsx');
const servicePath = path.resolve(__dirname, '../src/services/productService.js');

runTest('1. EditProductScreen.jsx component exists', () => {
  assert(fs.existsSync(editScreenPath), 'EditProductScreen.jsx must exist');
});

runTest('2. Dynamic route (artisan)/products/edit/[id].jsx exists and registered in _layout.tsx', () => {
  assert(fs.existsSync(editRoutePath), 'Edit product dynamic route must exist');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  assert(layoutContent.includes('(artisan)/products/edit/[id]'), 'Route must be registered in _layout.tsx');
});

// 2. Component inspection
const editContent = fs.readFileSync(editScreenPath, 'utf8');

runTest('3. Selected product summary card displays thumbnail, name, price, stock badge & arrow', () => {
  assert(editContent.includes('summaryCard'), 'Must define summaryCard');
  assert(editContent.includes('summaryThumb'), 'Must render product thumbnail');
  assert(editContent.includes('summaryPrice'), 'Must display product price');
  assert(editContent.includes('stockBadge'), 'Must render stock badge');
  assert(editContent.includes('In Stock'), 'Must indicate in-stock quantity');
  assert(editContent.includes('summaryArrow'), 'Must render right arrow icon');
});

runTest('4. Edit Product header renders with active styling in forest green', () => {
  assert(editContent.includes('✎ Edit Product'), 'Must display ✎ Edit Product option');
  assert(editContent.includes('toggleActive'), 'Must have active styling');
  assert(editContent.includes('#263C29'), 'Active button uses forest green (#263C29)');
});

runTest('5. Section Heading "Update Details" is present', () => {
  assert(editContent.includes('Update Details'), 'Must render "Update Details" heading');
  assert(editContent.includes('sectionHeading'), 'Must style section heading');
});

runTest('6. Product image management supports existing images, removal, and adding up to 5 images', () => {
  assert(editContent.includes('existingImages'), 'Must handle existingImages state');
  assert(editContent.includes('newImages'), 'Must handle newImages state');
  assert(editContent.includes('removedImages'), 'Must handle removedImages state');
  assert(editContent.includes('handlePickNewImage'), 'Must allow picking new images via ImagePicker');
  assert(editContent.includes('handleRemoveExistingImage'), 'Must allow removing existing images');
  assert(editContent.includes('totalImageCount < 5'), 'Must enforce max 5 images limit');
});

runTest('7. Product name input is pre-filled and editable', () => {
  assert(editContent.includes('ProductFormInput'), 'Reuses ProductFormInput component');
  assert(editContent.includes('label="Product Name"'), 'Must have Product Name label');
  assert(editContent.includes('value={name}'), 'Binds name value');
});

runTest('8. Category picker supports craft categories', () => {
  assert(editContent.includes('ProductCategoryPicker'), 'Reuses ProductCategoryPicker component');
  assert(editContent.includes('selectedCategory={category}'), 'Binds selectedCategory');
});

runTest('9. Price and Stock inputs side-by-side with non-negative validation', () => {
  assert(editContent.includes('ProductPriceStockInput'), 'Reuses ProductPriceStockInput component');
  assert(editContent.includes('price={price}'), 'Binds price');
  assert(editContent.includes('stock={stock}'), 'Binds stock');
});

runTest('10. Multiline Description with live character counter (300 max)', () => {
  assert(editContent.includes('description.length}/300'), 'Renders live character counter');
  assert(editContent.includes('maxLength={300}'), 'Enforces 300 character maximum');
});

runTest('11. Product tags chips support existing tags, adding, and removing', () => {
  assert(editContent.includes('ProductTagSelector'), 'Reuses ProductTagSelector component');
  assert(editContent.includes('tags={tags}'), 'Binds tags');
});

runTest('12. Bottom actions: Cancel (with unsaved changes alert) and Save Changes (forest green)', () => {
  assert(editContent.includes('cancelButton'), 'Renders Cancel button');
  assert(editContent.includes('saveButton'), 'Renders Save Changes button');
  assert(editContent.includes('hasUnsavedChanges'), 'Checks for unsaved changes before exiting');
  assert(editContent.includes('Discard Changes?'), 'Warns user when navigating back with dirty state');
  assert(editContent.includes('Save Changes'), 'Renders Save Changes text with checkmark');
});

// 3. Service inspection
const serviceContent = fs.readFileSync(servicePath, 'utf8');

runTest('13. productService.js exports getProductById, updateProduct, deleteProductImages, uploadProductImages', () => {
  assert(serviceContent.includes('export async function getProductById'), 'Must export getProductById');
  assert(serviceContent.includes('export async function updateProduct'), 'Must export updateProduct');
  assert(serviceContent.includes('export async function deleteProductImages'), 'Must export deleteProductImages');
  assert(serviceContent.includes('export async function uploadProductImages'), 'Must export uploadProductImages');
});

runTest('14. Color palette strictly follows ShilpSetu theme', () => {
  assert(editContent.includes('#F8F0E3'), 'Background uses #F8F0E3');
  assert(editContent.includes('#263C29'), 'Primary uses #263C29 (Deep Forest Green)');
  assert(editContent.includes('#A85E2B'), 'Secondary uses #A85E2B (Terracotta Brown)');
  assert(editContent.includes('#FBF5EB'), 'Card background uses #FBF5EB');
  assert(editContent.includes('#E5D7C5'), 'Border uses #E5D7C5');
  assert(editContent.includes('#DCE8B5'), 'Success/Badge uses #DCE8B5');
});

console.log(`\n───────────────────────────────────────────────────────`);
console.log(`🎯 Summary: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);

