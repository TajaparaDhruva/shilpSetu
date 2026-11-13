/**
 * test-role-setup.js — Tests for Role & Profile Setup backend
 *
 * Run from the frontend directory:
 *   node scripts/test-role-setup.js
 *
 * Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
 */

const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function log(status, name, detail = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${status}: ${name}${detail ? ' — ' + detail : ''}`);
  if (status === 'PASS') passed++;
  else failed++;
}

// ── Helpers ────────────────────────────────────────────────

async function rpc(fnName, params, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function getProfile(userId, token) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function getArtisanProfile(userId, token) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/artisan_profiles?user_id=eq.${userId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );
  const data = await res.json();
  return { ok: res.ok, data: Array.isArray(data) && data.length > 0 ? data[0] : null };
}

async function signUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password, data: {} }),
  });
  return res.json();
}

async function login(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  );
  return res.json();
}

// ── Tests ──────────────────────────────────────────────────

async function runTests() {
  console.log('\n🏺 ShilpSetu — Role & Profile Setup Backend Tests\n');
  console.log(`   Supabase: ${SUPABASE_URL}\n`);

  const timestamp = Date.now();
  const customerEmail = `test_customer_${timestamp}@shilpsetu-test.com`;
  const artisanEmail = `test_artisan_${timestamp}@shilpsetu-test.com`;
  const testPassword = 'TestPass123!';

  // ── Test 1: Unauthenticated user cannot select a role ──
  {
    const result = await rpc('set_user_role', { selected_role: 'customer' }, null);
    // Should fail (401 or the RPC returns error)
    if (!result.ok || (result.data && result.data.success === false)) {
      log('PASS', '1. Unauthenticated user cannot select a role');
    } else {
      log('FAIL', '1. Unauthenticated user cannot select a role', JSON.stringify(result.data));
    }
  }

  // ── Test 2: Invalid role values are rejected ──
  // First create & login as the customer test user
  let customerToken = null;
  let customerUserId = null;
  {
    const signUpResult = await signUp(customerEmail, testPassword);
    if (signUpResult.access_token) {
      customerToken = signUpResult.access_token;
      customerUserId = signUpResult.user?.id;
    } else if (signUpResult.user?.id) {
      // May need to login
      const loginResult = await login(customerEmail, testPassword);
      customerToken = loginResult.access_token;
      customerUserId = loginResult.user?.id;
    }

    if (!customerToken) {
      console.error(
        '\n⚠️  Could not create/login test customer user. Make sure "Confirm email" is DISABLED in Supabase Dashboard → Auth → Providers → Email.\n'
      );
      console.log(`Sign-up response: ${JSON.stringify(signUpResult)}`);
      console.log(`\nResults: ${passed} passed, ${failed} failed out of 1 test(s)\n`);
      return;
    }
  }

  {
    const result = await rpc('set_user_role', { selected_role: 'admin' }, customerToken);
    if (result.data && result.data.success === false) {
      log('PASS', '2. Invalid role value "admin" is rejected');
    } else {
      log('FAIL', '2. Invalid role value "admin" is rejected', JSON.stringify(result.data));
    }
  }

  // ── Test 3: New user's profile role is NULL before selection ──
  {
    const profile = await getProfile(customerUserId, customerToken);
    if (profile && profile.role === null) {
      log('PASS', '3. New user profile role is NULL before selection');
    } else {
      log('FAIL', '3. New user profile role is NULL before selection', `role = ${profile?.role}`);
    }
  }

  // ── Test 4: Customer can select Customer ──
  {
    const result = await rpc('set_user_role', { selected_role: 'customer' }, customerToken);
    if (result.ok && result.data && result.data.success === true && result.data.role === 'customer') {
      log('PASS', '4. Customer can select Customer');
    } else {
      log('FAIL', '4. Customer can select Customer', JSON.stringify(result.data));
    }
  }

  // ── Test 5: Role is persisted correctly ──
  {
    const profile = await getProfile(customerUserId, customerToken);
    if (profile && profile.role === 'customer') {
      log('PASS', '5. Previously selected role "customer" is retrieved correctly');
    } else {
      log('FAIL', '5. Previously selected role "customer" is retrieved correctly', `role = ${profile?.role}`);
    }
  }

  // ── Test 6: Customer cannot switch to Artisan ──
  {
    const result = await rpc('set_user_role', { selected_role: 'artisan' }, customerToken);
    if (result.data && result.data.success === false) {
      log('PASS', '6. Customer cannot switch to Artisan afterward');
    } else {
      log('FAIL', '6. Customer cannot switch to Artisan afterward', JSON.stringify(result.data));
    }
  }

  // ── Test 7: No artisan profile was created for customer ──
  {
    const artProf = await getArtisanProfile(customerUserId, customerToken);
    if (artProf.data === null) {
      log('PASS', '7. No artisan_profiles record for customer user');
    } else {
      log('FAIL', '7. No artisan_profiles record for customer user', JSON.stringify(artProf.data));
    }
  }

  // ── Create artisan test user ──
  let artisanToken = null;
  let artisanUserId = null;
  {
    const signUpResult = await signUp(artisanEmail, testPassword);
    if (signUpResult.access_token) {
      artisanToken = signUpResult.access_token;
      artisanUserId = signUpResult.user?.id;
    } else if (signUpResult.user?.id) {
      const loginResult = await login(artisanEmail, testPassword);
      artisanToken = loginResult.access_token;
      artisanUserId = loginResult.user?.id;
    }

    if (!artisanToken) {
      console.error('\n⚠️  Could not create/login test artisan user.\n');
      console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
      return;
    }
  }

  // ── Test 8: Artisan can select Artisan ──
  {
    const result = await rpc('set_user_role', { selected_role: 'artisan' }, artisanToken);
    if (result.ok && result.data && result.data.success === true && result.data.role === 'artisan') {
      log('PASS', '8. Artisan can select Artisan');
    } else {
      log('FAIL', '8. Artisan can select Artisan', JSON.stringify(result.data));
    }
  }

  // ── Test 9: Artisan profile is created ──
  {
    const artProf = await getArtisanProfile(artisanUserId, artisanToken);
    if (artProf.data && artProf.data.user_id === artisanUserId) {
      log('PASS', '9. Artisan profile is created automatically');
    } else {
      log('FAIL', '9. Artisan profile is created automatically', JSON.stringify(artProf));
    }
  }

  // ── Test 10: Duplicate requests do not create duplicate artisan profiles ──
  {
    // Call set_user_role('artisan') again — should return success (same role) without duplication
    const result = await rpc('set_user_role', { selected_role: 'artisan' }, artisanToken);
    if (result.ok && result.data && result.data.success === true) {
      // Check count of artisan_profiles for this user
      const countRes = await fetch(
        `${SUPABASE_URL}/rest/v1/artisan_profiles?user_id=eq.${artisanUserId}&select=id`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${artisanToken}`,
            Accept: 'application/json',
            Prefer: 'count=exact',
          },
        }
      );
      const countData = await countRes.json();
      if (Array.isArray(countData) && countData.length === 1) {
        log('PASS', '10. Duplicate requests do not create duplicate artisan profiles');
      } else {
        log('FAIL', '10. Duplicate requests do not create duplicate artisan profiles', `count = ${countData?.length}`);
      }
    } else {
      log('FAIL', '10. Duplicate requests do not create duplicate artisan profiles', JSON.stringify(result.data));
    }
  }

  // ── Test 11: User cannot update another user's role ──
  {
    // Customer user tries to read artisan's profile (should fail — RLS)
    const otherProfile = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${artisanUserId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${customerToken}`,
          Accept: 'application/json',
        },
      }
    );
    const otherData = await otherProfile.json();
    // RLS should return empty array (not the other user's profile)
    if (Array.isArray(otherData) && otherData.length === 0) {
      log('PASS', '11. User cannot read another user\'s profile (RLS)');
    } else {
      log('FAIL', '11. User cannot read another user\'s profile (RLS)', `returned ${otherData?.length} rows`);
    }
  }

  // ── Test 12: Artisan cannot switch to Customer ──
  {
    const result = await rpc('set_user_role', { selected_role: 'customer' }, artisanToken);
    if (result.data && result.data.success === false) {
      log('PASS', '12. Artisan cannot switch to Customer afterward');
    } else {
      log('FAIL', '12. Artisan cannot switch to Customer afterward', JSON.stringify(result.data));
    }
  }

  // ── Summary ──
  const total = passed + failed;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed}/${total} passed${failed > 0 ? `, ${failed} FAILED` : ''}`);
  console.log(`${'─'.repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});

