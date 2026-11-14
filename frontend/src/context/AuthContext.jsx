import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
  getCurrentUser,
  getAccessToken,
  getSession,
  loginWithEmail as authLoginWithEmail,
  loginWithGoogle as authLoginWithGoogle,
  signUpWithEmail as authSignUpWithEmail,
  logout as authLogout,
  getUserProfile,
  getPostAuthRoute,
  getInitialRoute,
} from '@/services/auth';
import { getUserProfile as fetchProfile, setUserRole as saveRoleService } from '@/services/profileService';
import { resetLocalCartCache, getCartItems } from '@/services/cartService';
import { resetLocalWishlistCache, getWishlist } from '@/services/wishlistService';

const AuthContext = createContext(null);

/**
 * Global Authentication & Role Provider for ShilpSetu
 *
 * Responsibilities:
 * 1. Tracks currentUser, session, userProfile, userRole, loading.
 * 2. Manages persistent session restoration on app open.
 * 3. Enforces Route Protection:
 *    - Customers cannot access (artisan) routes.
 *    - Artisans cannot access (customer) order/checkout routes.
 *    - Unauthenticated users cannot access protected routes.
 * 4. Provides clean login, logout, and role update APIs.
 */
export function AuthProvider({ children }) {
  const router = useRouter();
  const segments = useSegments();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial session and profile on launch
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const currentUser = await getCurrentUser();
        const currentSession = getSession();

        if (currentUser && isMounted) {
          setUser(currentUser);
          setSession(currentSession);

          // Retrieve database profile and role
          let userProfile = null;
          try {
            userProfile = await getUserProfile(currentUser.id);
          } catch {
            // fallback
          }

          let effectiveRole =
            userProfile?.role ||
            currentUser.user_metadata?.role ||
            currentUser.app_metadata?.role ||
            null;

          if (isMounted) {
            setProfile(userProfile);
            setRole(effectiveRole);
          }

          // Hydrate persistent cart and wishlist for customer
          if (effectiveRole === 'customer') {
            getCartItems().catch(() => {});
            getWishlist().catch(() => {});
          }
        }
      } catch (err) {
        console.warn('AuthProvider initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Route Guard
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'sign-up' || segments[0] === 'forgot-password';
    const inRoleSetup = segments[0] === 'role-setup';
    const inCustomerGroup = segments[0] === '(customer)' || segments[0] === 'customer-home';
    const inArtisanGroup = segments[0] === '(artisan)' || segments[0] === 'artisan-dashboard';

    // 1. Not authenticated trying to access protected screens
    if (!user && (inCustomerGroup || inArtisanGroup || inRoleSetup)) {
      router.replace('/login');
      return;
    }

    // 2. Authenticated user without selected role: ALWAYS route to role-setup if trying to hit any dashboard or home
    if (user && !role) {
      if (inCustomerGroup || inArtisanGroup) {
        router.replace('/role-setup');
        return;
      }
    }

    // 3. Authenticated user WITH a chosen role trying to access role-setup again
    if (user && role && inRoleSetup) {
      if (role === 'artisan') {
        router.replace('/(artisan)/dashboard');
      } else {
        router.replace('/(customer)/home');
      }
      return;
    }

    // 4. Customer trying to access Artisan management screens
    if (user && role === 'customer' && inArtisanGroup) {
      router.replace('/(customer)/home');
      return;
    }
  }, [user, role, loading, segments]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const authResult = await authLoginWithEmail(email, password);
      setUser(authResult.user);
      setSession(authResult.session);
      setProfile(authResult.profile);

      const effectiveRole =
        authResult.profile?.role ||
        authResult.user?.user_metadata?.role ||
        authResult.user?.app_metadata?.role ||
        null;

      setRole(effectiveRole);

      // Restore user-specific data from Supabase
      if (effectiveRole === 'customer') {
        getCartItems().catch(() => {});
        getWishlist().catch(() => {});
      }

      return authResult;
    } finally {
      setLoading(false);
    }
  };

  // Google Login handler
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const authResult = await authLoginWithGoogle();
      setUser(authResult.user);
      setSession(authResult.session);
      setProfile(authResult.profile);

      const effectiveRole =
        authResult.profile?.role ||
        authResult.user?.user_metadata?.role ||
        authResult.user?.app_metadata?.role ||
        null;

      setRole(effectiveRole);

      // Restore user-specific data from Supabase
      if (effectiveRole === 'customer') {
        getCartItems().catch(() => {});
        getWishlist().catch(() => {});
      }

      return authResult;
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler
  const signUp = async (email, password, fullName) => {
    setLoading(true);
    try {
      const res = await authSignUpWithEmail(email, password, fullName);
      if (res?.user) {
        setUser(res.user);
      }
      if (res?.session) {
        setSession(res.session);
      }
      // New signups strictly have no role selected yet
      setRole(null);
      setProfile(null);
      return res;
    } finally {
      setLoading(false);
    }
  };

  // Save role during onboarding
  const saveRole = async (selectedRole) => {
    const result = await saveRoleService(selectedRole);
    setRole(selectedRole);
    if (profile) {
      setProfile({ ...profile, role: selectedRole });
    }
    return result;
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await authLogout();
      // Clear in-memory state without deleting database records
      resetLocalCartCache();
      resetLocalWishlistCache();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      role,
      loading,
      login,
      loginWithGoogle,
      signUp,
      saveRole,
      logout,
      isAuthenticated: Boolean(user),
      isArtisan: role === 'artisan',
      isCustomer: role === 'customer',
    }),
    [user, session, profile, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

