import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';

import { ShilpColors } from '@/constants/shilpSetuTheme';
import { getInitialRoute } from '@/services/auth';

const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');

/**
 * Root index — Auth Gate
 *
 * On app launch, checks for an existing session:
 *  • No session → /login
 *  • Session + no role → /role-setup
 *  • Session + customer → /customer-home
 *  • Session + artisan → /artisan-dashboard
 *
 * Shows a branded loading screen while checking.
 */
export default function IndexPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolveRoute = async () => {
      try {
        const route = await getInitialRoute();
        if (mounted) {
          router.replace(route);
        }
      } catch {
        if (mounted) {
          router.replace('/login');
        }
      } finally {
        if (mounted) setChecking(false);
      }
    };

    resolveRoute();
    return () => { mounted = false; };
  }, []);

  // Branded splash/loading screen while determining auth state
  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />
      <Image
        source={lotusLogo}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={styles.brandTitle}>
        <Text style={styles.brandShilp}>Shilp</Text>
        <Text style={styles.brandSetu}>Setu</Text>
      </Text>
      <ActivityIndicator
        color={ShilpColors.primary}
        size="small"
        style={styles.spinner}
      />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ShilpColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 72,
    height: 62,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 24,
  },
  brandShilp: {
    color: ShilpColors.text,
  },
  brandSetu: {
    color: ShilpColors.secondary,
  },
  spinner: {
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 13,
    color: ShilpColors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
