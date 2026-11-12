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
import { ShilpColors } from '@/constants/shilpSetuTheme';
import { resetPassword } from '@/services/auth';

const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const lotusDivider = require('@/assets/images/shilpsetu/lotus-divider.svg');
const topLeftBranch = require('@/assets/images/shilpsetu/top-left-branch.svg');
const topRightDecor = require('@/assets/images/shilpsetu/top-right-decor.svg');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setErrorMsg('');
    setLoading(true);

    try {
      await resetPassword(trimmed);
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />

      <View style={styles.decorContainer} pointerEvents="none">
        <Image source={topLeftBranch} style={styles.topLeftBranch} contentFit="contain" />
        <Image source={topRightDecor} style={styles.topRightDecor} contentFit="contain" />
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
              <Text style={styles.heading}>Recover Password</Text>
              <Image source={lotusDivider} style={styles.lotusDivider} contentFit="contain" />
              <Text style={styles.subtitle}>
                Enter the email associated with your account and we'll send you recovery instructions.
              </Text>
            </View>

            {message ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{message}</Text>
              </View>
            ) : null}

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.formSection}>
              <AuthInput
                icon="mail"
                placeholder="Enter your email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
              />

              <PrimaryButton
                title="Send Instructions"
                onPress={handleReset}
                loading={loading}
                showArrow={false}
              />

              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </TouchableOpacity>
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
    paddingTop: 24,
    alignItems: 'center',
  },
  decorContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: 'hidden',
  },
  topLeftBranch: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 145,
    height: 180,
  },
  topRightDecor: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 135,
    height: 170,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
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
    marginBottom: 8,
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
    width: 26,
    height: 16,
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: ShilpColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  formSection: {
    width: '100%',
    maxWidth: 420,
    marginTop: 12,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: ShilpColors.secondary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  successBanner: {
    width: '100%',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
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

