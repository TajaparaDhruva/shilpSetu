import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// Complete any pending auth session in web browser
WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Session storage key
const SESSION_STORAGE_KEY = 'shilpsetu_auth_session';

// In-memory session cache for fast access
let currentSession = null;
let currentUser = null;

export const getAccessToken = () => currentSession?.access_token || null;
export const getSession = () => currentSession;

// Lightweight in-memory/web storage adapter
const storage = {
  async getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Ignore web storage errors
    }
    return null;
  },
  async setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore web storage errors
    }
  },
  async removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore web storage errors
    }
  },
};

/**
 * Check whether Supabase environment variables are configured
 */
export const isSupabaseConfigured = () => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your_supabase_project_url') &&
    !SUPABASE_ANON_KEY.includes('your_supabase_publishable_key')
  );
};

const assertConfigured = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured yet. Please configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your frontend .env file.'
    );
  }
};

/**
 * Parse URL fragment (hash) or query string into key-value map
 */
const parseAuthParams = (url) => {
  const params = {};
  if (!url) return params;

  // Check hash fragment first (#access_token=...)
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  let queryString = '';
  if (hashIndex !== -1) {
    queryString = url.substring(hashIndex + 1);
  } else if (queryIndex !== -1) {
    queryString = url.substring(queryIndex + 1);
  }

  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key.replace(/\+/g, ' '))] = decodeURIComponent(
          value.replace(/\+/g, ' ')
        );
      }
    }
  }

  return params;
};

/**
 * Set active session in memory and persistent storage
 */
const saveSession = async (sessionData) => {
  currentSession = sessionData;
  currentUser = sessionData?.user || null;
  if (sessionData) {
    await storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  } else {
    await storage.removeItem(SESSION_STORAGE_KEY);
  }
};

/**
 * A. Email and Password Login
 * Authenticates user via Supabase Auth REST endpoint: /auth/v1/token?grant_type=password
 */
export async function loginWithEmail(email, password) {
  assertConfigured();

  const trimmedEmail = (email || '').trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error('Please enter your email address.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const endpoint = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: trimmedEmail,
        password,
      }),
    });
  } catch (networkError) {
    throw new Error('Network error: Unable to connect to Supabase authentication server.');
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error_description || data.msg || data.message || 'Invalid email or password.';
    const lower = errorMsg.toLowerCase();
    if (lower.includes('email not confirmed') || data.error_code === 'email_not_confirmed') {
      throw new Error('Email not confirmed. Please check your email inbox to verify, or disable "Confirm email" in Supabase Dashboard.');
    } else if (lower.includes('invalid login credentials')) {
      throw new Error('Invalid email or password. If you just registered, your Supabase project may require email confirmation.');
    }
    throw new Error(errorMsg);
  }

  // Format and save session
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: data.user,
  };

  await saveSession(session);

  // Try fetching profile
  let profile = null;
  try {
    profile = await getUserProfile(data.user.id, data.access_token);
  } catch {
    // If profile cannot be loaded immediately, user object is still valid
  }

  // Cross-check: If profile didn't report artisan, check artisan_profiles table or user_metadata
  if (!profile || profile.role !== 'artisan') {
    const isMetaArtisan = (
      data.user.user_metadata?.role === 'artisan' ||
      data.user.app_metadata?.role === 'artisan' ||
      data.user.user_metadata?.is_artisan === true
    );

    if (isMetaArtisan) {
      if (!profile) profile = { id: data.user.id };
      profile.role = 'artisan';
    } else {
      // Check if this user exists in artisan_profiles table
      try {
        const artEndpoint = `${SUPABASE_URL}/rest/v1/artisan_profiles?user_id=eq.${encodeURIComponent(data.user.id)}&select=id`;
        const artRes = await fetch(artEndpoint, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        if (artRes.ok) {
          const artRows = await artRes.json();
          if (Array.isArray(artRows) && artRows.length > 0) {
            if (!profile) profile = { id: data.user.id };
            profile.role = 'artisan';
          }
        }
      } catch {
        // Ignore check errors
      }
    }
  }

  return {
    user: data.user,
    session,
    profile,
  };
}

/**
 * Sign Up with Email and Password
 */
export async function signUpWithEmail(email, password, fullName = '') {
  assertConfigured();

  const trimmedEmail = (email || '').trim().toLowerCase();
  if (!trimmedEmail) throw new Error('Please enter your email address.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  const endpoint = `${SUPABASE_URL}/auth/v1/signup`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: trimmedEmail,
      password,
      data: {
        full_name: fullName.trim(),
        name: fullName.trim(),
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || data.error_description || data.message || 'Registration failed.');
  }

  const needsEmailConfirmation = Boolean(
    data.user && !data.session && !data.user.confirmed_at && !data.user.email_confirmed_at
  );

  let activeSession = null;
  if (data.session) {
    activeSession = {
      access_token: data.session.access_token || data.access_token,
      refresh_token: data.session.refresh_token || data.refresh_token,
      expires_in: data.session.expires_in || data.expires_in || 3600,
      expires_at: Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600),
      user: data.user,
    };
    await saveSession(activeSession);
  } else if (!needsEmailConfirmation) {
    // Automatically log in to acquire an active session for the role setup page
    try {
      const loginRes = await loginWithEmail(trimmedEmail, password);
      activeSession = loginRes.session;
    } catch {
      // ignore
    }
  }

  return {
    user: data.user,
    session: activeSession || data.session,
    needsEmailConfirmation,
  };
}

/**
 * Process OAuth callback URL containing access_token or authorization code
 */
async function processAuthCallbackUrl(url) {
  const params = parseAuthParams(url);

  if (params.error) {
    throw new Error(params.error_description || params.error || 'Google authentication failed.');
  }

  if (params.access_token) {
    const session = {
      access_token: params.access_token,
      refresh_token: params.refresh_token || '',
      expires_in: parseInt(params.expires_in || '3600', 10),
      expires_at: Math.floor(Date.now() / 1000) + parseInt(params.expires_in || '3600', 10),
      token_type: params.token_type || 'bearer',
    };

    const user = await fetchUserFromToken(session.access_token);
    session.user = user;
    await saveSession(session);

    let profile = null;
    try {
      profile = await getUserProfile(user.id, session.access_token);
    } catch {
      // Fallback
    }

    return {
      user,
      session,
      profile,
    };
  }

  if (params.code) {
    const tokenEndpoint = `${SUPABASE_URL}/auth/v1/token?grant_type=pkce`;
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        auth_code: params.code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.msg || 'Failed to exchange authorization code.');
    }

    const session = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
      user: tokenData.user,
    };

    await saveSession(session);

    let profile = null;
    try {
      profile = await getUserProfile(tokenData.user.id, session.access_token);
    } catch {
      // Fallback
    }

    // Cross-check: If profile didn't report artisan, check artisan_profiles table or user_metadata
    if (!profile || profile.role !== 'artisan') {
      const isMetaArtisan = (
        tokenData.user.user_metadata?.role === 'artisan' ||
        tokenData.user.app_metadata?.role === 'artisan' ||
        tokenData.user.user_metadata?.is_artisan === true
      );

      if (isMetaArtisan) {
        if (!profile) profile = { id: tokenData.user.id };
        profile.role = 'artisan';
      } else {
        try {
          const artEndpoint = `${SUPABASE_URL}/rest/v1/artisan_profiles?user_id=eq.${encodeURIComponent(tokenData.user.id)}&select=id`;
          const artRes = await fetch(artEndpoint, {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (artRes.ok) {
            const artRows = await artRes.json();
            if (Array.isArray(artRows) && artRows.length > 0) {
              if (!profile) profile = { id: tokenData.user.id };
              profile.role = 'artisan';
            }
          }
        } catch {
          // Ignore check errors
        }
      }
    }

    return {
      user: tokenData.user,
      session,
      profile,
    };
  }

  throw new Error('Authentication callback was received but contained no access token.');
}

/**
 * B. Google OAuth Authentication
 * Initiates Google OAuth using Supabase Auth with Expo-compatible deep linking
 */
export async function loginWithGoogle() {
  assertConfigured();

  // 1. Verify that Google OAuth is enabled in Supabase project settings
  try {
    const settingsRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      if (settings?.external && settings.external.google === false) {
        throw new Error(
          'Google authentication is NOT enabled yet in your Supabase Dashboard.\n\nPlease go to Supabase Dashboard -> Authentication -> Providers -> Google, toggle it ON, and add your Google Client ID and Secret.'
        );
      }
    }
  } catch (err) {
    if (err.message.includes('Google authentication is NOT enabled')) {
      throw err;
    }
    // Proceed if settings check had transient network glitch
  }

  // 2. Construct the deep linking redirect URL for Expo
  const redirectUrl = Linking.createURL('auth/callback');

  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
    redirectUrl
  )}`;

  // Web Platform: direct browser redirect
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = authUrl;
    return new Promise(() => {}); // Wait for page unload
  }

  // Mobile Platform: Dual-listener with openAuthSessionAsync & Linking event
  return new Promise(async (resolve, reject) => {
    let handled = false;
    let subscription = null;

    const cleanup = () => {
      if (subscription) {
        subscription.remove();
        subscription = null;
      }
      try {
        WebBrowser.dismissAuthSession();
      } catch {}
    };

    const handleCallbackUrl = async (url) => {
      if (handled || !url) return;
      handled = true;
      cleanup();

      try {
        const sessionData = await processAuthCallbackUrl(url);
        resolve(sessionData);
      } catch (err) {
        reject(err);
      }
    };

    // Deep link listener for OS redirects
    subscription = Linking.addEventListener('url', (event) => {
      if (
        event?.url &&
        (event.url.includes('access_token') ||
          event.url.includes('code=') ||
          event.url.includes('error='))
      ) {
        handleCallbackUrl(event.url);
      }
    });

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (handled) return;

      if (result.type === 'success' && result.url) {
        await handleCallbackUrl(result.url);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        handled = true;
        cleanup();
        const cancelError = new Error('Google sign-in was cancelled.');
        cancelError.code = 'USER_CANCELLED';
        reject(cancelError);
      } else {
        handled = true;
        cleanup();
        reject(
          new Error(
            'Google login window was closed. If it was loading endlessly, check your Supabase Redirect URLs.'
          )
        );
      }
    } catch (browserErr) {
      if (handled) return;
      handled = true;
      cleanup();
      reject(browserErr);
    }
  });
}

/**
 * Fetch authenticated user from Supabase using access token
 */
async function fetchUserFromToken(accessToken) {
  const endpoint = `${SUPABASE_URL}/auth/v1/user`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || data.message || 'Failed to retrieve authenticated user.');
  }
  return data;
}

/**
 * C. Forgot Password
 * Sends a password recovery email via Supabase Auth
 */
export async function resetPassword(email) {
  assertConfigured();

  const trimmedEmail = (email || '').trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error('Please enter your email address.');
  }

  const endpoint = `${SUPABASE_URL}/auth/v1/recover`;
  const redirectUrl = Linking.createURL('auth/reset-password');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: trimmedEmail,
      redirect_to: redirectUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data.error_description || data.msg || data.message || 'Failed to send recovery email.';
    throw new Error(message);
  }

  return {
    success: true,
    message: 'Password reset instructions have been sent to your email.',
    data,
  };
}

/**
 * Log out and clear session
 */
export async function logout() {
  if (isSupabaseConfigured() && currentSession?.access_token) {
    try {
      const endpoint = `${SUPABASE_URL}/auth/v1/logout`;
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }

  await saveSession(null);
  return { success: true };
}

/**
 * D. Get Currently Authenticated User
 */
export async function getCurrentUser() {
  if (currentUser) {
    return currentUser;
  }

  // Try restoring from storage
  try {
    const stored = await storage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      if (session?.access_token) {
        currentSession = session;
        currentUser = session.user || null;

        // Verify if token is still valid
        if (isSupabaseConfigured()) {
          try {
            const user = await fetchUserFromToken(session.access_token);
            currentUser = user;
            session.user = user;
            await saveSession(session);
            return user;
          } catch {
            // Token expired or invalid
            await saveSession(null);
            return null;
          }
        }
        return currentUser;
      }
    }
  } catch {
    // Ignore storage read error
  }

  return null;
}

/**
 * E. Get User Profile from public.profiles table
 */
export async function getUserProfile(userId, token = null) {
  assertConfigured();

  const accessToken = token || currentSession?.access_token;
  if (!accessToken) {
    throw new Error('Authentication required to access user profile.');
  }

  const endpoint = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.hint || 'Failed to retrieve profile.');
  }

  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }

  return null;
}

// Backward-compatible named exports
export const signInWithEmail = loginWithEmail;
export const signInWithGoogle = loginWithGoogle;
export const sendPasswordResetEmail = resetPassword;

/**
 * F. Update User Role via Supabase RPC (set_user_role)
 * Uses a SECURITY DEFINER function so it bypasses the role-protection trigger.
 * @param {'customer' | 'artisan'} role
 * @returns {Promise<{ success: boolean, role: string }>}
 */
export async function updateUserRole(role) {
  assertConfigured();

  if (!role || !['customer', 'artisan'].includes(role)) {
    throw new Error('Invalid role. Must be "customer" or "artisan".');
  }

  const accessToken = currentSession?.access_token;
  if (!accessToken) {
    throw new Error('Authentication required. Please log in first.');
  }

  const userId = currentUser?.id;
  const endpoint = `${SUPABASE_URL}/rest/v1/rpc/set_user_role`;

  // 1. Try selected_role
  let response;
  let data;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ selected_role: role }),
    });
    data = await response.json();
  } catch (networkError) {
    // proceed
  }

  // 2. Fallback to new_role if selected_role was not in schema cache
  const isSchemaError =
    !response ||
    response.status === 404 ||
    data?.message?.includes('schema cache') ||
    data?.hint?.includes('selected_role') ||
    data?.error?.includes('schema cache');

  if (isSchemaError) {
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ new_role: role }),
      });
      data = await response.json();
    } catch {
      // ignore
    }
  }

  // 3. Fallback: Direct table update
  const isStillSchemaError =
    !response ||
    response.status === 404 ||
    data?.message?.includes('schema cache') ||
    data?.error?.includes('schema cache');

  if (isStillSchemaError) {
    // 3a. Save role directly to Supabase Auth user metadata so it persists across sessions
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          data: {
            role,
            is_artisan: role === 'artisan',
          },
        }),
      });
    } catch {
      // ignore
    }

    if (userId) {
      try {
        const updateRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ role, updated_at: new Date().toISOString() }),
          }
        );

        if (updateRes.ok) {
          if (role === 'artisan') {
            await fetch(`${SUPABASE_URL}/rest/v1/artisan_profiles`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ user_id: userId }),
            }).catch(() => {});
          }
          return { success: true, role };
        }
      } catch {
        // ignore
      }
    }

    return { success: true, role };
  }

  if (!response || !response.ok) {
    throw new Error(data?.message || data?.hint || data?.error || 'Failed to update role.');
  }

  if (data && data.success === false) {
    throw new Error(data.error || 'Failed to update role.');
  }

  return data;
}

/**
 * G. Get User Role from profile
 * Returns the role string ('customer' | 'artisan') or null if not yet chosen.
 * Separates profile-fetch errors from genuinely null roles.
 * @returns {Promise<{ role: string | null, profileExists: boolean, error: string | null }>}
 */
export async function getUserRole() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { role: null, profileExists: false, error: 'NOT_AUTHENTICATED' };
    }

    let profile = null;
    try {
      profile = await getUserProfile(user.id);
    } catch {
      // ignore
    }

    let role = profile?.role || user.user_metadata?.role || user.app_metadata?.role || null;

    if (role !== 'artisan') {
      try {
        const token = getAccessToken();
        if (token) {
          const artRes = await fetch(
            `${SUPABASE_URL}/rest/v1/artisan_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=id`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (artRes.ok) {
            const artRows = await artRes.json();
            if (Array.isArray(artRows) && artRows.length > 0) {
              role = 'artisan';
            }
          }
        }
      } catch {
        // ignore
      }
    }

    return { role: role || null, profileExists: Boolean(profile), error: null };
  } catch (err) {
    return { role: null, profileExists: false, error: err.message || 'PROFILE_FETCH_FAILED' };
  }
}

/**
 * H. Get Initial Route based on auth state and profile
 * Determines where the app should navigate on launch or after auth.
 *
 * Returns one of:
 *   '/login'              — no active session
 *   '/role-setup'         — authenticated but role is NULL
 *   '/customer-home'      — role is 'customer'
 *   '/artisan-dashboard'  — role is 'artisan'
 *
 * @returns {Promise<string>}
 */
export async function getInitialRoute() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return '/login';
    }

    let profile = null;
    try {
      profile = await getUserProfile(user.id);
    } catch {
      // Profile fetch failed (network error, etc.)
    }

    // Check role across profile, metadata, and artisan table
    let role = profile?.role || user.user_metadata?.role || user.app_metadata?.role || null;

    if (role !== 'artisan') {
      try {
        const token = getAccessToken();
        if (token) {
          const artRes = await fetch(
            `${SUPABASE_URL}/rest/v1/artisan_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=id`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (artRes.ok) {
            const artRows = await artRes.json();
            if (Array.isArray(artRows) && artRows.length > 0) {
              role = 'artisan';
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (!role) {
      return '/role-setup';
    }

    if (role === 'artisan') {
      return '/(artisan)/dashboard';
    }

    return '/(customer)/home';
  } catch {
    return '/login';
  }
}

/**
 * I. Determine route after authentication result
 * Takes the auth result (with profile) and returns the target route.
 * Checks profile.role, user_metadata.role, app_metadata.role, and is_artisan flag.
 * @param {{ profile: object | null, user?: object | null }} authResult
 * @returns {string}
 */
export function getPostAuthRoute(authResult) {
  if (!authResult) return '/login';

  const profile = authResult.profile;
  const user = authResult.user;

  const role =
    profile?.role ||
    user?.user_metadata?.role ||
    user?.raw_user_meta_data?.role ||
    user?.app_metadata?.role ||
    (user?.user_metadata?.is_artisan ? 'artisan' : null);

  if (!role) {
    return '/role-setup';
  }

  if (role === 'artisan') {
    return '/(artisan)/dashboard';
  }

  return '/(customer)/home';
}
