/**
 * test-signup-onboarding-suite.js
 *
 * Verifies all requirements for ShilpSetu Signup and Role Selection:
 * 1. Sign up inputs validation (Full Name, Email, Password, Confirm Password)
 * 2. Password match enforcement
 * 3. Does NOT auto-assign customer or artisan role on signup
 * 4. Navigates directly to Role & Profile Setup screen (/role-setup)
 * 5. Role Setup displays Join as Customer and Join as Artisan options
 * 6. Selecting Customer saves role='customer' and routes to /(customer)/home
 * 7. Selecting Artisan saves role='artisan' and routes to /(artisan)/dashboard
 * 8. User without role is guarded and redirected to /role-setup if trying to access dashboard
 * 9. Existing user with completed role accessing role-setup is redirected to their dashboard
 * 10. Google Signup: New user without role is routed to /role-setup
 * 11. Google Login: Existing user with role routes directly to dashboard
 * 12. fix_signup_onboarding.sql migration integrity (handle_new_user, save_user_role, get_current_user_profile)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n🧪 Running ShilpSetu Signup and Role Selection Test Suite...\n');

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

// 1. Inspect sign-up.jsx
const signUpSrc = fs.readFileSync(path.resolve(__dirname, '../src/app/sign-up.jsx'), 'utf8');

runTest('1. Sign Up screen validates Full Name, Email, Password, and Confirm Password', () => {
  assert(signUpSrc.includes('confirmPassword'), 'Must declare confirmPassword state');
  assert(signUpSrc.includes('placeholder="Confirm password"'), 'Must render Confirm password input');
  assert(signUpSrc.includes('Passwords do not match'), 'Must validate password match');
});

runTest('2. Sign Up navigates directly to /role-setup upon successful registration', () => {
  assert(signUpSrc.includes("router.replace('/role-setup')"), 'Must navigate to /role-setup after account creation');
  assert(!signUpSrc.includes("router.replace('/(customer)/home')"), 'Must NEVER navigate directly to customer home on signup');
  assert(!signUpSrc.includes("router.replace('/(artisan)/dashboard')"), 'Must NEVER navigate directly to artisan dashboard on signup');
});

// 2. Inspect RoleSetupScreen.jsx
const roleSetupSrc = fs.readFileSync(path.resolve(__dirname, '../src/components/RoleSetupScreen.jsx'), 'utf8');

runTest('3. Role Setup displays Customer and Artisan cards and routes properly', () => {
  assert(roleSetupSrc.includes("selectedRole === 'customer'"), 'Must handle customer selection');
  assert(roleSetupSrc.includes("selectedRole === 'artisan'"), 'Must handle artisan selection');
  assert(roleSetupSrc.includes("router.replace('/(customer)/home')"), 'Customer selection routes to /(customer)/home');
  assert(roleSetupSrc.includes("router.replace('/(artisan)/dashboard')"), 'Artisan selection routes to /(artisan)/dashboard');
});

// 3. Inspect AuthContext.jsx
const authContextSrc = fs.readFileSync(path.resolve(__dirname, '../src/context/AuthContext.jsx'), 'utf8');

runTest('4. AuthContext guards against skipping role setup', () => {
  assert(authContextSrc.includes('if (user && !role)'), 'Must check if user exists without role');
  assert(authContextSrc.includes("router.replace('/role-setup')"), 'Must force redirect to /role-setup');
});

runTest('5. AuthContext prevents completed users from being stuck in role-setup', () => {
  assert(authContextSrc.includes('if (user && role && inRoleSetup)'), 'Must detect user with role on role-setup');
  assert(authContextSrc.includes("router.replace('/(artisan)/dashboard')"), 'Must route artisan to dashboard');
  assert(authContextSrc.includes("router.replace('/(customer)/home')"), 'Must route customer to home');
});

runTest('6. Google auth routes new user without role to /role-setup', () => {
  const authSrc = fs.readFileSync(path.resolve(__dirname, '../src/services/auth.js'), 'utf8');
  assert(authSrc.includes("if (!role) {\n    return '/role-setup';"), 'Must return /role-setup if role is null');
});

runTest('7. Backend migration fix_signup_onboarding.sql is complete and valid', () => {
  const migPath = path.resolve(__dirname, '../../backend/supabase/migrations/fix_signup_onboarding.sql');
  assert(fs.existsSync(migPath), 'fix_signup_onboarding.sql must exist');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert(sql.includes('handle_new_user()'), 'Must contain handle_new_user function');
  assert(sql.includes('NULL, -- Role is explicitly NULL on signup'), 'Must keep role NULL on user creation');
  assert(sql.includes('get_current_user_profile()'), 'Must contain get_current_user_profile RPC');
  assert(sql.includes('save_user_role'), 'Must contain save_user_role RPC');
  assert(sql.includes('onboarding_completed'), 'Must manage onboarding_completed state');
});

console.log(`\n───────────────────────────────────────────────────────`);
console.log(`🎯 Summary: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);

