import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AuthInput from './AuthInput';
import PrimaryButton from './PrimaryButton';
import GoogleLoginButton from './GoogleLoginButton';
import { ShilpColors } from '@/constants/shilpSetuTheme';
import {
  loginWithEmail,
  loginWithGoogle,
  isSupabaseConfigured,
} from '@/services/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Visual Assets
const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const lotusDivider = require('@/assets/images/shilpsetu/lotus-divider.svg');
const topRightDecor = require('@/assets/images/shilpsetu/top-right-decor.svg');
const bottomLeftBranch = require('@/assets/images/shilpsetu/bottom-left-branch.svg');
const bottomWaves = require('@/assets/images/shilpsetu/bottom-waves.svg');
const checkIcon = require('@/assets/images/shilpsetu/icon-check.svg');

export default function LoginScreen({ onLoginSuccess }) {
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Status & Error State
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email format validation
  const validateEmail = (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Password validation
  const validatePassword = (text) => {
    if (!text) {
      return 'Password is required';
    }
    if (text.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (authError) setAuthError('');
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
    if (authError) setAuthError('');
  };

  const handleLogin = async () => {
    // Validate inputs
    const eError = validateEmail(email);
    const pError = validatePassword(password);

    setEmailError(eError);
    setPasswordError(pError);

    if (eError || pError) {
      return;
    }

    setLoading(true);
    setAuthError('');

    try {
      const data = await loginWithEmail(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(data);
      } else {
        // Always go to role-setup so the user can confirm or choose their role
        router.replace('/role-setup');
      }
    } catch (err) {
      const message = err.message || 'Login failed. Please verify your credentials.';
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setAuthError('');

    try {
      const result = await loginWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess(result);
      } else {
        router.replace('/role-setup');
      }
    } catch (err) {
      if (err.code === 'USER_CANCELLED') {
        // User cancelled the browser session, no error banner needed
        return;
      }
      const message = err.message || 'Google authentication failed.';
      setAuthError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const navigateToForgotPassword = () => {
    router.push('/forgot-password');
  };

  const navigateToSignUp = () => {
    router.push('/sign-up');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />

      {/* Decorative Corner & Background Graphics (Non-blocking) */}
      <View style={styles.decorContainer} pointerEvents="none">
        <Image
          source={topRightDecor}
          style={styles.topRightDecor}
          contentFit="fill"
        />
        <Image
          source={bottomWaves}
          style={styles.bottomWaves}
          contentFit="fill"
        />
        <Image
          source={bottomLeftBranch}
          style={styles.bottomLeftBranch}
          contentFit="contain"
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. ShilpSetu Lotus Logo */}
            <View style={styles.logoSection}>
              <Image
                source={lotusLogo}
                style={styles.lotusLogo}
                contentFit="contain"
                accessibilityLabel="ShilpSetu lotus logo"
              />

              {/* 2. ShilpSetu Brand Name */}
              <Text style={styles.brandTitle}>
                <Text style={styles.brandShilp}>Shilp</Text>
                <Text style={styles.brandSetu}>Setu</Text>
              </Text>

              {/* 3. Tagline */}
              <Text style={styles.tagline}>
                CRAFTS  •  PEOPLE  •  OPPORTUNITIES
              </Text>

              {/* 4. Heading: Welcome Back */}
              <Text style={styles.heading}>Welcome Back</Text>

              {/* 5. Decorative Lotus Divider */}
              <View style={styles.lotusDividerContainer}>
                <Image
                  source={lotusDivider}
                  style={styles.lotusDivider}
                  contentFit="contain"
                  accessibilityLabel="decorative lotus motif"
                />
              </View>

              {/* 6. Subtitle */}
              <Text style={styles.subtitle}>
                Login to continue your journey{'\n'}with ShilpSetu.
              </Text>
            </View>

            {/* Error Banner */}
            {authError ? (
              <View style={styles.authErrorBanner} accessibilityRole="alert">
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* 7. Email input with email icon */}
              <AuthInput
                icon="mail"
                placeholder="Enter your email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
                testID="login-email-input"
              />

              {/* 8. Password input with lock icon & 9. Password visibility toggle */}
              <AuthInput
                icon="lock"
                placeholder="Enter your password"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                showPasswordToggle
                isPasswordVisible={isPasswordVisible}
                onTogglePasswordVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
                error={passwordError}
                testID="login-password-input"
              />

              {/* 10. Remember Me checkbox & 11. Forgot Password link */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  accessibilityLabel="Remember me"
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && (
                      <Image
                        source={checkIcon}
                        style={styles.checkIcon}
                        contentFit="contain"
                      />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={navigateToForgotPassword}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Forgot Password"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* 12. Large forest-green Login button with terracotta circular arrow */}
              <PrimaryButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                testID="login-submit-button"
              />

              {/* 13. OR divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 14. Continue with Google button */}
              <GoogleLoginButton
                onPress={handleGoogleLogin}
                loading={googleLoading}
                testID="google-login-button"
              />

              {/* 15. Don't have an account? Sign Up link */}
              <View style={styles.signUpRow}>
                <Text style={styles.signUpPromptText}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={navigateToSignUp}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Sign Up"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.signUpLinkText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom spacer to preserve space for pottery and curved footer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ShilpColors.background,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  /* Decorative Corner Graphics */
  decorContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: 'hidden',
  },
  topRightDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 160,
    height: 240,
  },
  bottomWaves: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.72,
    height: 180,
  },
  bottomLeftBranch: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 160,
    height: 185,
  },

  /* Logo & Header Section */
  logoSection: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 16,
    width: '100%',
  },
  lotusLogo: {
    width: 72,
    height: 62,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 6,
  },
  brandShilp: {
    color: ShilpColors.text,
  },
  brandSetu: {
    color: ShilpColors.secondary,
  },
  tagline: {
    fontSize: 10.5,
    fontWeight: '600',
    color: ShilpColors.textSecondary,
    letterSpacing: 2.2,
    marginBottom: 18,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: ShilpColors.text,
    letterSpacing: 0.2,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 4,
  },
  lotusDividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    width: '100%',
  },
  lotusDivider: {
    width: 180,
    height: 20,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: ShilpColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  /* Error Banner */
  authErrorBanner: {
    width: '100%',
    backgroundColor: ShilpColors.errorBackground,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C2C7',
  },
  authErrorText: {
    color: ShilpColors.error,
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* Form Section */
  formSection: {
    width: '100%',
    maxWidth: 420,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 4.5,
    borderWidth: 1.6,
    borderColor: ShilpColors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  checkboxChecked: {
    backgroundColor: ShilpColors.primary,
  },
  checkIcon: {
    width: 11,
    height: 11,
  },
  rememberMeText: {
    fontSize: 13.5,
    color: ShilpColors.text,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13.5,
    color: ShilpColors.secondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ShilpColors.divider,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: ShilpColors.dividerText,
    marginHorizontal: 14,
    letterSpacing: 1,
  },

  /* Sign Up Link */
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  signUpPromptText: {
    fontSize: 14,
    color: ShilpColors.text,
  },
  signUpLinkText: {
    fontSize: 14,
    color: ShilpColors.secondary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* Bottom Spacer to prevent overlap with decorative pot */
  bottomSpacer: {
    height: 48,
  },
});

