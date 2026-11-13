/**
 * Comprehensive Automated Test Suite for ShilpSetu Artisan Dashboard
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

console.log('\n--- ShilpSetu Artisan Dashboard Test Suite ---\n');

const COMP_DIR = path.resolve(__dirname, '../src/components/artisan-dashboard');
const SERVICE_PATH = path.resolve(__dirname, '../src/services/artisanDashboardService.js');

// 1. Check all required reusable components exist
runTest('All required Artisan Dashboard components exist', () => {
  const requiredFiles = [
    'ArtisanDashboardScreen.jsx',
    'ArtisanDashboardHeader.jsx',
    'ArtisanWelcomeSection.jsx',
    'ArtisanBanner.jsx',
    'ArtisanStatsGrid.jsx',
    'ArtisanStatCard.jsx',
    'ArtisanQuickActions.jsx',
    'RecentOrdersSection.jsx',
    'ArtisanRecentOrderCard.jsx',
    'ArtisanBottomNavigation.jsx',
    'ArtisanNavigationDrawer.jsx',
  ];

  requiredFiles.forEach((file) => {
    assert(fs.existsSync(path.join(COMP_DIR, file)), `Missing component: ${file}`);
  });
});

// 2. Check Routes & Layout Registration
runTest('Artisan routes are registered in app and _layout.tsx', () => {
  assert(fs.existsSync(path.resolve(__dirname, '../src/app/artisan-dashboard.jsx')), 'Missing artisan-dashboard.jsx');
  assert(fs.existsSync(path.resolve(__dirname, '../src/app/(artisan)/dashboard/index.jsx')), 'Missing (artisan)/dashboard/index.jsx');

  const layout = fs.readFileSync(path.resolve(__dirname, '../src/app/_layout.tsx'), 'utf8');
  assert(layout.includes('name="artisan-dashboard"'), '_layout.tsx must register artisan-dashboard');
  assert(layout.includes('name="(artisan)/dashboard/index"'), '_layout.tsx must register (artisan)/dashboard/index');
});

// 3. Check Header elements
runTest('ArtisanDashboardHeader contains hamburger, logo, unread notification & online avatar', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ArtisanDashboardHeader.jsx'), 'utf8');
  assert(content.includes('icon-menu.svg'), 'Header missing menu icon');
  assert(content.includes('lotus-logo.svg'), 'Header missing lotus logo');
  assert(content.includes('icon-bell.svg'), 'Header missing bell icon');
  assert(content.includes('onlineIndicator'), 'Header missing online status indicator');
});

// 4. Check Welcome Section
runTest('ArtisanWelcomeSection greets artisan with actual dynamic name', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ArtisanWelcomeSection.jsx'), 'utf8');
  assert(content.includes('Welcome, {artisanName} 👋'), 'Welcome section must render dynamic name with emoji');
  assert(content.includes('Artisan Dashboard'), 'Welcome section missing subtitle');
});

// 5. Check Promotional Banner
runTest('ArtisanBanner contains exact promotional text and Add New Product button', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ArtisanBanner.jsx'), 'utf8');
  assert(content.includes('Create · List · Sell'), 'Banner missing tagline');
  assert(content.includes('Showcase your handmade crafts to a wider audience across India.'), 'Banner missing description');
  assert(content.includes('Add New Product'), 'Banner missing Add New Product button');
  assert(content.includes('banner-pottery.svg'), 'Banner missing craft pottery image');
});

// 6. Check Stats Grid
runTest('ArtisanStatsGrid renders 4 cards: Products, Orders, Earnings, Rating', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ArtisanStatsGrid.jsx'), 'utf8');
  assert(content.includes('Total Products'), 'Stats missing Total Products');
  assert(content.includes('Total Orders'), 'Stats missing Total Orders');
  assert(content.includes('Total Earnings'), 'Stats missing Total Earnings');
  assert(content.includes('Average Rating') || content.includes('Reviews'), 'Stats missing Rating/Reviews');
  assert(content.includes('toLocaleString'), 'Stats must format numbers with Indian comma formatting');
});

// 7. Check Quick Actions
runTest('ArtisanQuickActions contains 4 cards: Add Product, Manage Products, Orders, Earnings', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ArtisanQuickActions.jsx'), 'utf8');
  assert(content.includes('Add Product'), 'Quick actions missing Add Product');
  assert(content.includes('Manage Products') || content.includes('Manage\\nProducts'), 'Quick actions missing Manage Products');
  assert(content.includes('Orders'), 'Quick actions missing Orders');
  assert(content.includes('Earnings'), 'Quick actions missing Earnings');
});

// 8. Check Recent Orders & Order Card
runTest('RecentOrdersSection and ArtisanRecentOrderCard render order items and status badges', () => {
  const sectionContent = fs.readFileSync(path.join(COMP_DIR, 'RecentOrdersSection.jsx'), 'utf8');
  assert(sectionContent.includes('Recent Orders'), 'Section missing Recent Orders heading');
  assert(sectionContent.includes('View All →'), 'Section missing View All link');

  const cardContent = fs.readFileSync(path.join(COMP_DIR, 'ArtisanRecentOrderCard.jsx'), 'utf8');
  assert(cardContent.includes('#{orderNumber}'), 'Order card missing order number');
  assert(cardContent.includes('{productName}'), 'Order card missing product name');
  assert(cardContent.includes('Qty: {quantity}'), 'Order card missing quantity');
});

// 9. Check Artisan Bottom Navigation
runTest('ArtisanBottomNavigation contains 5 tabs: Dashboard, Products, Orders, Earnings, Profile', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ArtisanBottomNavigation.jsx'), 'utf8');
  const tabs = ['Dashboard', 'Products', 'Orders', 'Earnings', 'Profile'];
  tabs.forEach((tab) => {
    assert(content.includes(tab), `Bottom nav missing tab: ${tab}`);
  });
});

// 10. Check Navigation Drawer
runTest('ArtisanNavigationDrawer contains drawer items and profile info', () => {
  const content = fs.readFileSync(path.join(COMP_DIR, 'ArtisanNavigationDrawer.jsx'), 'utf8');
  assert(content.includes('Artisan Dashboard'), 'Drawer missing Artisan Dashboard option');
  assert(content.includes('Switch to Customer View'), 'Drawer missing switch option');
  assert(content.includes('Sign Out'), 'Drawer missing Sign Out option');
});

// 11. Check artisanDashboardService exports
runTest('artisanDashboardService exports profile, stats and recent orders loaders', () => {
  const service = fs.readFileSync(SERVICE_PATH, 'utf8');
  assert(service.includes('export async function getArtisanDashboardProfile'), 'Missing getArtisanDashboardProfile');
  assert(service.includes('export async function getArtisanDashboardStats'), 'Missing getArtisanDashboardStats');
  assert(service.includes('export async function getArtisanRecentOrders'), 'Missing getArtisanRecentOrders');
  assert(service.includes('FALLBACK_ARTISAN_STATS'), 'Missing fallback stats');
  assert(service.includes('FALLBACK_ARTISAN_ORDERS'), 'Missing fallback orders');
});

console.log(`\nTests finished: ${testsPassed} passed, ${testsFailed} failed.\n`);
if (testsFailed > 0) process.exit(1);

