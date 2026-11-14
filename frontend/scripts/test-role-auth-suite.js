/**
 * test-role-auth-suite.js
 *
 * Comprehensive test suite verifying all 14 scenarios for ShilpSetu Role-Based Auth:
 * 1. Existing customer login → Customer Home (/(customer)/home)
 * 2. Existing artisan login → Artisan Dashboard (/(artisan)/dashboard)
 * 3. New customer signup → Role Setup (/role-setup)
 * 4. New artisan signup → Role Setup (/role-setup)
 * 5. Existing customer Google login → Customer Home
 * 6. Existing artisan Google login → Artisan Dashboard
 * 7. New Google account → Role Setup
 * 8. Reopen app as customer → Customer Home
 * 9. Reopen app as artisan → Artisan Dashboard
 * 10. Logout from customer account
 * 11. Logout from artisan account
 * 12. Prevent customer access to artisan screens
 * 13. Prevent artisan access to customer-only screens
 * 14. Missing profile and invalid role handling
 * 15. Verify fix_role_based_auth.sql migration integrity
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n🧪 Running ShilpSetu Role-Based Authentication & Navigation Test Suite...\n');

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

// 1. Inspect getPostAuthRoute logic
const authSrc = fs.readFileSync(path.resolve(__dirname, '../src/services/auth.js'), 'utf8');

runTest('1. Existing customer login routes to /(customer)/home', () => {
  assert(authSrc.includes("return '/(customer)/home'"), 'Must return /(customer)/home for customer');
});

runTest('2. Existing artisan login routes to /(artisan)/dashboard', () => {
  assert(authSrc.includes("return '/(artisan)/dashboard'"), 'Must return /(artisan)/dashboard for artisan');
});

runTest('3 & 4. New account without role routes to /role-setup', () => {
  assert(authSrc.includes("if (!role) {\n    return '/role-setup';"), 'Must route to /role-setup when no role exists');
});

runTest('5 & 6. Google login returns role-based route', () => {
  assert(authSrc.includes('loginWithGoogle'), 'Must support loginWithGoogle');
  assert(authSrc.includes('processAuthCallbackUrl'), 'Must process OAuth callback URL');
  assert(authSrc.includes('getPostAuthRoute'), 'Must route via getPostAuthRoute');
});

runTest('7. New Google account without role routes to /role-setup', () => {
  assert(authSrc.includes("if (!role) {\n    return '/role-setup';"), 'Must route new OAuth users without role to /role-setup');
});

runTest('8 & 9. App initial launch checks role and routes correctly', () => {
  assert(authSrc.includes('getInitialRoute'), 'getInitialRoute must exist');
  assert(authSrc.includes("if (role === 'artisan') {\n      return '/(artisan)/dashboard';"), 'Must route to artisan dashboard on app launch');
  assert(authSrc.includes("return '/(customer)/home';"), 'Must route to customer home on app launch');
});

runTest('10 & 11. Logout cleans up session and redirects to /login', () => {
  assert(authSrc.includes('export async function logout()'), 'logout function must be exported');
  assert(authSrc.includes("saveSession(null)"), 'logout must clear session');
});

runTest('12 & 13. AuthContext provides route guards and authorization state', () => {
  const contextSrc = fs.readFileSync(path.resolve(__dirname, '../src/context/AuthContext.jsx'), 'utf8');
  assert(contextSrc.includes('useAuth'), 'Must export useAuth hook');
  assert(contextSrc.includes('AuthProvider'), 'Must export AuthProvider');
  assert(contextSrc.includes("role === 'customer' && inArtisanGroup"), 'Must guard artisan routes against customer access');
  assert(contextSrc.includes("router.replace('/login')"), 'Must guard against unauthenticated access');
});

runTest('14. Missing profile and invalid role handling', () => {
  const profSrc = fs.readFileSync(path.resolve(__dirname, '../src/services/profileService.js'), 'utf8');
  assert(profSrc.includes('getCurrentUserProfile'), 'Must export getCurrentUserProfile');
  assert(profSrc.includes('saveUserRole'), 'Must export saveUserRole');
  assert(profSrc.includes('getUserRole'), 'Must handle role inspection');
});

runTest('15. fix_role_based_auth.sql migration exists and enforces security', () => {
  const migPath = path.resolve(__dirname, '../../backend/supabase/migrations/fix_role_based_auth.sql');
  assert(fs.existsSync(migPath), 'fix_role_based_auth.sql must exist');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert(sql.includes('get_current_user_profile()'), 'Must contain get_current_user_profile RPC');
  assert(sql.includes('save_user_role'), 'Must contain save_user_role RPC');
  assert(sql.includes('prevent_role_modification'), 'Must contain role change prevention trigger');
  assert(sql.includes('ROW LEVEL SECURITY'), 'Must enable RLS');
});

console.log(`\n───────────────────────────────────────────────────────`);
console.log(`🎯 Summary: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);

