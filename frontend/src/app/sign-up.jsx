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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AuthInput from '@/components/AuthInput';
import PrimaryButton from '@/components/PrimaryButton';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { ShilpColors } from '@/constants/shilpSetuTheme';
import {
  signUpWithEmail,
  loginWithGoogle,
  isSupabaseConfigured,
  getPostAuthRoute,
} from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const lotusDivider = require('@/assets/images/shilpsetu/lotus-divider.svg');
const topRightDecor = require('@/assets/images/shilpsetu/top-right-decor.svg');

export default function SignUpScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignUp = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    if (!isSupabaseConfigured()) {
      setErrorMessage('Supabase is not configured yet. Please configure your .env file.');
      setLoading(false);
      return;
    }

    try {
      const result = auth
        ? await auth.signUp(trimmedEmail, password, trimmedName)
        : await signUpWithEmail(trimmedEmail, password, trimmedName);

      if (result.needsEmailConfirmation) {
        Alert.alert(
          'Verify Your Email',
          'Account created! Please check your email inbox to verify your account before logging in.',
          [{ text: 'Go to Login', onPress: () => router.replace('/login') }]
        );
      } else {
        // Navigate immediately to Role & Profile Setup screen
        router.replace('/role-setup');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setErrorMessage('');
    try {
      const result = auth ? await auth.loginWithGoogle() : await loginWithGoogle();
      const route = getPostAuthRoute(result);
      router.replace(route);
    } catch (err) {
      if (err.code === 'USER_CANCELLED') {
        return;
      }
      setErrorMessage(err.message || 'Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />

      <View style={styles.decorContainer} pointerEvents="none">
        <Image source={topRightDecor} style={styles.topRightDecor} contentFit="fill" />
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
            <View style={styles.headerSection}>
              <Image source={lotusLogo} style={styles.lotusLogo} contentFit="contain" />
              <Text style={styles.brandTitle}>
                <Text style={styles.brandShilp}>Shilp</Text>
                <Text style={styles.brandSetu}>Setu</Text>
              </Text>
              <Text style={styles.heading}>Create Account</Text>
              <Image source={lotusDivider} style={styles.lotusDivider} contentFit="contain" />
              <Text style={styles.subtitle}>
                Join ShilpSetu and discover handcrafted treasures from authentic artisans.
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.formSection}>
              <AuthInput
                icon="mail"
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

              <AuthInput
                icon="mail"
                placeholder="Enter your email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AuthInput
                icon="lock"
                placeholder="Create password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry
                showPasswordToggle
                isPasswordVisible={isPasswordVisible}
                onTogglePasswordVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
              />

              <AuthInput
                icon="lock"
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry
                showPasswordToggle
                isPasswordVisible={isConfirmPasswordVisible}
                onTogglePasswordVisibility={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              />

              <PrimaryButton
                title="Create Account"
                onPress={handleSignUp}
                loading={loading}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <GoogleLoginButton
                title="Sign up with Google"
                onPress={handleGoogleSignUp}
                loading={googleLoading}
              />

              <View style={styles.loginRow}>
                <Text style={styles.loginPromptText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/login')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLinkText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
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
  headerSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    width: '100%',
  },
  lotusLogo: {
    width: 64,
    height: 54,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 26,
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
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: ShilpColors.text,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 6,
  },
  lotusDivider: {
    width: 180,
    height: 20,
    marginVertical: 6,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: ShilpColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  formSection: {
    width: '100%',
    maxWidth: 420,
    marginTop: 10,
  },
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  loginPromptText: {
    fontSize: 14,
    color: ShilpColors.text,
  },
  loginLinkText: {
    fontSize: 14,
    color: ShilpColors.secondary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  errorBanner: {
    width: '100%',
    backgroundColor: ShilpColors.errorBackground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C2C7',
  },
  errorText: {
    color: ShilpColors.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

