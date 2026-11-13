
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import RoleSelectionCard from './RoleSelectionCard';
import PrimaryButton from './PrimaryButton';
import { ShilpColors } from '@/constants/shilpSetuTheme';
import { getCurrentUser } from '@/services/auth';
import { setUserRole, getUserProfile } from '@/services/profileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Visual Assets (reuse existing)
const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const lotusDivider = require('@/assets/images/shilpsetu/lotus-divider.svg');
const topRightDecor = require('@/assets/images/shilpsetu/top-right-decor.svg');
const bottomLeftBranch = require('@/assets/images/shilpsetu/bottom-left-branch.svg');
const bottomWaves = require('@/assets/images/shilpsetu/bottom-waves.svg');

// Role card illustrations
const shoppingBagIcon = require('@/assets/images/shilpsetu/icon-shopping-bag.svg');
const potteryIcon = require('@/assets/images/shilpsetu/icon-pottery.svg');

export default function RoleSetupScreen() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingRole, setExistingRole] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // On mount, verify authentication and initialize the role selection
  useEffect(() => {
    let mounted = true;

    const checkAuthAndInit = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          // Not authenticated — redirect to login
          router.replace('/login');
          return;
        }

        let profile = null;
        try {
          profile = await getUserProfile(user.id);
        } catch {
          // Profile fetch optional on initial load
        }

        if (mounted) {
          if (profile && profile.role) {
            setSelectedRole(profile.role);
          }
          setInitializing(false);
        }
      } catch {
        if (mounted) setInitializing(false);
      }
    };

    checkAuthAndInit();
    return () => { mounted = false; };
  }, []);

  const handleContinue = async () => {
    if (!selectedRole) {
      setErrorMessage('Please select a role to continue.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await setUserRole(selectedRole);

      // Navigate based on role
      if (selectedRole === 'customer') {
        router.replace('/customer-home');
      } else if (selectedRole === 'artisan') {
        router.replace('/artisan-dashboard');
      }
    } catch (err) {
      const message = err.message || 'Failed to save your role. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role) => {
    if (loading) return;
    setSelectedRole(role);
    if (errorMessage) setErrorMessage('');
  };

  // While loading initial profile data
  if (initializing) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <StatusBar style="dark" backgroundColor={ShilpColors.background} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />

      {/* Decorative Background Graphics */}
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
            {/* Logo & Header Section */}
            <View style={styles.logoSection}>
              <Image
                source={lotusLogo}
                style={styles.lotusLogo}
                contentFit="contain"
                accessibilityLabel="ShilpSetu lotus logo"
              />

              {/* Brand Name */}
              <Text style={styles.brandTitle}>
                <Text style={styles.brandShilp}>Shilp</Text>
                <Text style={styles.brandSetu}>Setu</Text>
              </Text>

              {/* Tagline */}
              <Text style={styles.tagline}>
                CRAFTS  •  PEOPLE  •  OPPORTUNITIES
              </Text>

              {/* Heading */}
              <Text style={styles.heading}>Role & Profile Setup</Text>

              {/* Decorative Lotus Divider */}
              <View style={styles.lotusDividerContainer}>
                <Image
                  source={lotusDivider}
                  style={styles.lotusDivider}
                  contentFit="contain"
                  accessibilityLabel="decorative lotus motif"
                />
              </View>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Choose how you want to join ShilpSetu
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Role Selection Cards */}
            <View style={styles.cardsSection}>
              <RoleSelectionCard
                icon={shoppingBagIcon}
                title="Join as a Customer"
                description="Discover and buy unique handcrafted products."
                selected={selectedRole === 'customer'}
                onPress={() => handleSelectRole('customer')}
                disabled={loading}
                testID="role-card-customer"
              />

              <RoleSelectionCard
                icon={potteryIcon}
                title="Join as an Artisan"
                description="Showcase and sell your handmade creations."
                selected={selectedRole === 'artisan'}
                onPress={() => handleSelectRole('artisan')}
                disabled={loading}
                testID="role-card-artisan"
              />
            </View>

            {/* Continue Button */}
            <View style={styles.buttonSection}>
              <PrimaryButton
                title="Continue"
                onPress={handleContinue}
                loading={loading}
                disabled={!selectedRole}
                showArrow={true}
                testID="role-continue-button"
              />
            </View>

            {/* Bottom spacer for decorative elements */}
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: ShilpColors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
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

  /* Logo & Header */
  logoSection: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
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
    fontStyle: 'italic',
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
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  /* Error Banner */
  errorBanner: {
    width: '100%',
    backgroundColor: ShilpColors.errorBackground,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F5C2C7',
  },
  errorText: {
    color: ShilpColors.error,
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* Cards Section */
  cardsSection: {
    width: '100%',
    maxWidth: 420,
    marginTop: 8,
    marginBottom: 8,
  },

  /* Button Section */
  buttonSection: {
    width: '100%',
    maxWidth: 420,
    marginTop: 10,
  },

  /* Bottom Spacer */
  bottomSpacer: {
    height: 60,
  },
});

