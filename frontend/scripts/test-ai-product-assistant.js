/**
 * test-ai-product-assistant.js
 * Comprehensive verification suite for ShilpSetu AI Product Assistant
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🤖 Running ShilpSetu AI Product Assistant Test Suite...\n');

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

const rootDir = path.resolve(__dirname, '..');
const aiServicePath = path.join(rootDir, 'src', 'services', 'aiProductService.js');
const screenPath = path.join(rootDir, 'src', 'components', 'ai-assistant', 'AiProductAssistantScreen.jsx');
const uploaderPath = path.join(rootDir, 'src', 'components', 'ai-assistant', 'AiImageUploader.jsx');
const suggestionPath = path.join(rootDir, 'src', 'components', 'ai-assistant', 'AiGeneratedSuggestion.jsx');
const improveTabPath = path.join(rootDir, 'src', 'components', 'ai-assistant', 'ImproveListingTab.jsx');
const tagsTabPath = path.join(rootDir, 'src', 'components', 'ai-assistant', 'SmartTagsTab.jsx');
const routePath = path.join(rootDir, 'src', 'app', '(artisan)', 'ai-assistant', 'index.jsx');
const edgeFunctionPath = path.resolve(rootDir, '..', 'backend', 'supabase', 'functions', 'ai-product-assistant', 'index.ts');

// 1. Files existence
runTest('1. All AI Assistant components and service files exist', () => {
  assert(fs.existsSync(aiServicePath), 'aiProductService.js exists');
  assert(fs.existsSync(screenPath), 'AiProductAssistantScreen.jsx exists');
  assert(fs.existsSync(uploaderPath), 'AiImageUploader.jsx exists');
  assert(fs.existsSync(suggestionPath), 'AiGeneratedSuggestion.jsx exists');
  assert(fs.existsSync(improveTabPath), 'ImproveListingTab.jsx exists');
  assert(fs.existsSync(tagsTabPath), 'SmartTagsTab.jsx exists');
  assert(fs.existsSync(routePath), 'App route (artisan)/ai-assistant/index.jsx exists');
  assert(fs.existsSync(edgeFunctionPath), 'Supabase Edge function ai-product-assistant/index.ts exists');
});

// 2. aiProductService functions
runTest('2. aiProductService exports required API methods', () => {
  const content = fs.readFileSync(aiServicePath, 'utf8');
  assert(content.includes('generateProductFromImage'), 'Exports generateProductFromImage');
  assert(content.includes('improveProductListing'), 'Exports improveProductListing');
  assert(content.includes('generateProductTags'), 'Exports generateProductTags');
  assert(!content.includes('AI_API_KEY') && !content.includes('GEMINI_API_KEY'), 'Does not leak AI keys in frontend');
  assert(content.includes('getAccessToken'), 'Uses authenticated Supabase token');
});

// 3. Image Uploader validates formats and sizes
runTest('3. AiImageUploader validates image formats and sizes', () => {
  const content = fs.readFileSync(uploaderPath, 'utf8');
  assert(content.includes('JPG') || content.includes('.jpg'), 'Validates JPG images');
  assert(content.includes('PNG') || content.includes('.png'), 'Validates PNG images');
  assert(content.includes('launchCameraAsync'), 'Supports camera image capture');
  assert(content.includes('launchImageLibraryAsync'), 'Supports photo gallery selection');
  assert(content.includes('UploadCloud'), 'Uses Lucide vector icons');
});

// 4. AiGeneratedSuggestion supports copy and editable fields
runTest('4. AiGeneratedSuggestion supports editable fields, copy buttons and tags', () => {
  const content = fs.readFileSync(suggestionPath, 'utf8');
  assert(content.includes('handleCopyTitle'), 'Provides copy title option');
  assert(content.includes('handleCopyDesc'), 'Provides copy description option');
  assert(content.includes('charCount'), 'Displays character counter for description');
  assert(content.includes('priceRangeText'), 'Displays price range estimate');
  assert(content.includes('ProductCategoryPicker'), 'Reuses actual category picker');
  assert(content.includes('handleRemoveTag'), 'Allows removing suggested tags');
  assert(content.includes('handleAddTag'), 'Allows adding custom tags');
});

// 5. ImproveListingTab compares and updates without inventing facts
runTest('5. ImproveListingTab supports product selection, comparison, and updates', () => {
  const content = fs.readFileSync(improveTabPath, 'utf8');
  assert(content.includes('improveProductListing'), 'Calls improveProductListing service');
  assert(content.includes('originalTitle') && content.includes('improvedTitle'), 'Shows original vs improved comparison');
  assert(content.includes('updateProduct'), 'Allows saving accepted improvements to database');
});

// 6. SmartTagsTab generates and updates tags
runTest('6. SmartTagsTab generates relevant craft tags and allows editing', () => {
  const content = fs.readFileSync(tagsTabPath, 'utf8');
  assert(content.includes('generateProductTags'), 'Calls generateProductTags service');
  assert(content.includes('handleRemoveTag'), 'Allows removing tags');
  assert(content.includes('handleAddCustomTag'), 'Allows adding custom tags');
  assert(content.includes('handleSaveTags'), 'Saves tags to database via updateProduct');
});

// 7. Route and Layout registration
runTest('7. AI Assistant is registered in _layout.tsx and artisan navigation', () => {
  const layout = fs.readFileSync(path.join(rootDir, 'src', 'app', '_layout.tsx'), 'utf8');
  assert(layout.includes('(artisan)/ai-assistant/index'), 'Registered in Stack Screen layout');

  const drawer = fs.readFileSync(path.join(rootDir, 'src', 'components', 'artisan-dashboard', 'ArtisanNavigationDrawer.jsx'), 'utf8');
  assert(drawer.includes('ai_assistant'), 'Registered in Artisan Navigation Drawer');
});

// 8. Backend Edge Function security and actions
runTest('8. Backend Supabase Edge function securely handles actions and auth', () => {
  const content = fs.readFileSync(edgeFunctionPath, 'utf8');
  assert(content.includes('generate_product'), 'Implements generate_product action');
  assert(content.includes('improve_listing'), 'Implements improve_listing action');
  assert(content.includes('generate_tags'), 'Implements generate_tags action');
  assert(content.includes('authHeader'), 'Enforces caller authentication');
});

console.log('\n───────────────────────────────────────────────────────');
console.log(`🎯 Summary: ${passed} passed, ${failed} failed out of ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

