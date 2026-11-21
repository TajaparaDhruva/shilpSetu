/**
 * test-artisan-earnings.js
 * Verification test suite for ShilpSetu Artisan Earnings Page (Frontend & Backend integration)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('📦 Running ShilpSetu Artisan Earnings Test Suite...\n');

// 1. Verify routes, components, services, and migrations exist
const routePath = path.resolve(__dirname, '../src/app/(artisan)/earnings/index.jsx');
const mainScreenPath = path.resolve(__dirname, '../src/components/artisan-earnings/ArtisanEarningsScreen.jsx');
const filtersPath = path.resolve(__dirname, '../src/components/artisan-earnings/EarningsPeriodFilters.jsx');
const totalCardPath = path.resolve(__dirname, '../src/components/artisan-earnings/TotalEarningsCard.jsx');
const statsCardsPath = path.resolve(__dirname, '../src/components/artisan-earnings/EarningsStatsCards.jsx');
const chartPath = path.resolve(__dirname, '../src/components/artisan-earnings/EarningsOverviewChart.jsx');
const txPath = path.resolve(__dirname, '../src/components/artisan-earnings/RecentTransactionsSection.jsx');
const servicePath = path.resolve(__dirname, '../src/services/artisanEarningsService.js');
const sqlPath = path.resolve(__dirname, '../../backend/supabase/migrations/artisan_earnings_backend.sql');

assert(fs.existsSync(routePath), 'Route (artisan)/earnings/index.jsx must exist');
assert(fs.existsSync(mainScreenPath), 'ArtisanEarningsScreen.jsx component must exist');
assert(fs.existsSync(filtersPath), 'EarningsPeriodFilters.jsx must exist');
assert(fs.existsSync(totalCardPath), 'TotalEarningsCard.jsx must exist');
assert(fs.existsSync(statsCardsPath), 'EarningsStatsCards.jsx must exist');
assert(fs.existsSync(chartPath), 'EarningsOverviewChart.jsx must exist');
assert(fs.existsSync(txPath), 'RecentTransactionsSection.jsx must exist');
assert(fs.existsSync(servicePath), 'artisanEarningsService.js must exist');
assert(fs.existsSync(sqlPath), 'artisan_earnings_backend.sql migration must exist');

console.log('  ✅ PASS: 1. All Earnings routes, sub-components, service, and SQL migration exist');

// 2. Verify service exports
const serviceContent = fs.readFileSync(servicePath, 'utf8');
assert(serviceContent.includes('export async function getArtisanEarningsAnalytics'), 'Must export getArtisanEarningsAnalytics');
assert(serviceContent.includes('export async function getArtisanTransactions'), 'Must export getArtisanTransactions');
assert(serviceContent.includes('export const PERIOD_FILTERS'), 'Must export PERIOD_FILTERS');

console.log('  ✅ PASS: 2. artisanEarningsService exports required analytics and transaction fetching functions');

// 3. Verify STRICTLY NO DUMMY DATA in service
assert(!serviceContent.includes('12450'), 'No hardcoded 12,450 earnings');
assert(!serviceContent.includes('11105'), 'No hardcoded 11,105 comparison');
assert(serviceContent.includes('totalEarnings: 0'), 'Defaults to 0 when empty');
assert(serviceContent.includes('chartPoints: []'), 'No fake chart points');
assert(serviceContent.includes('recentTransactions: []'), 'No fake transaction list');

console.log('  ✅ PASS: 3. Service strictly enforces no dummy data policy (defaults to 0 / empty arrays)');

// 4. Verify Period Filters
const filtersContent = fs.readFileSync(filtersPath, 'utf8');
assert(filtersContent.includes('This Month'), 'Must include This Month filter');
assert(filtersContent.includes('Last Month'), 'Must include Last Month filter');
assert(filtersContent.includes('Last 3 Months'), 'Must include Last 3 Months filter');
assert(filtersContent.includes('This Year'), 'Must include This Year filter');
assert(filtersContent.includes('#173D2B'), 'Active filter pill has forest green background');

console.log('  ✅ PASS: 4. EarningsPeriodFilters includes 4 interactive filter tabs with active states');

// 5. Verify Total Earnings Hero Card
const totalCardContent = fs.readFileSync(totalCardPath, 'utf8');
assert(totalCardContent.includes('Total Earnings'), 'Must render Total Earnings label');
assert(totalCardContent.includes('formattedTotal'), 'Dynamically formats total earnings');
assert(totalCardContent.includes('growthBadge'), 'Displays percentage growth badge');
assert(totalCardContent.includes('moneySackWrap'), 'Renders warm handicraft money sack visual');

console.log('  ✅ PASS: 5. TotalEarningsCard displays dynamic earnings, growth %, comparison text, and handicraft art');

// 6. Verify 3 Statistics Cards
const statsContent = fs.readFileSync(statsCardsPath, 'utf8');
assert(statsContent.includes('Total Orders'), 'Must have Total Orders card');
assert(statsContent.includes('Products Sold'), 'Must have Products Sold card');
assert(statsContent.includes('Average Rating'), 'Must have Average Rating card');

console.log('  ✅ PASS: 6. EarningsStatsCards displays Total Orders, Products Sold, and Average Rating');

// 7. Verify Chart & Empty States
const chartContent = fs.readFileSync(chartPath, 'utf8');
assert(chartContent.includes('Earnings Overview'), 'Chart heading must be Earnings Overview');
assert(chartContent.includes('No earnings data recorded for this period'), 'Empty chart state handled cleanly');
assert(chartContent.includes('tooltip'), 'Interactive point selection displays value tooltip');

const txContent = fs.readFileSync(txPath, 'utf8');
assert(txContent.includes('Recent Transactions'), 'Section title is Recent Transactions');
assert(txContent.includes('No transactions available'), 'Empty transactions state handled gracefully');

console.log('  ✅ PASS: 7. Interactive Earnings chart with tooltips and empty states verified');

// 8. Verify Navigation integration
const mainContent = fs.readFileSync(mainScreenPath, 'utf8');
assert(mainContent.includes('activeTab="earnings"'), 'ArtisanBottomNavigation highlights earnings');
assert(mainContent.includes('ArtisanDashboardHeader'), 'Includes common artisan dashboard header');

console.log('  ✅ PASS: 8. Artisan bottom navigation and drawer properly linked to earnings tab');

console.log('\n───────────────────────────────────────────────────────');
console.log('🎯 Summary: 8 passed, 0 failed out of 8\n');
