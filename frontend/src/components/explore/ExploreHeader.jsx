import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const iconBack = require('@/assets/images/shilpsetu/icon-back.svg');
const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const iconBell = require('@/assets/images/shilpsetu/icon-bell.svg');
const iconCart = require('@/assets/images/shilpsetu/icon-cart.svg');

export default function ExploreHeader({
  onNotificationPress,
  onCartPress,
  cartCount = 0,
}) {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(customer)/home');
    }
  };

  return (
    <View style={styles.header}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Image source={iconBack} style={styles.backIcon} contentFit="contain" />
      </TouchableOpacity>

      {/* Center: Lotus Logo & Brand Name */}
      <View style={styles.centerBrand}>
        <Image source={lotusLogo} style={styles.logoIcon} contentFit="contain" />
        <Text style={styles.brandTitle}>
          Shilp<Text style={styles.brandTitleAccent}>Setu</Text>
        </Text>
      </View>

      {/* Right Icons: Notifications & Shopping Cart */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Image source={iconBell} style={styles.actionIcon} contentFit="contain" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onCartPress || (() => router.push('/(customer)/cart'))}
          accessibilityRole="button"
          accessibilityLabel="Shopping cart"
        >
          <Image source={iconCart} style={styles.actionIcon} contentFit="contain" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F0E3',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  centerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 24,
  },
  brandTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 22,
    fontWeight: '700',
    color: '#263C29',
    letterSpacing: 0.3,
  },
  brandTitleAccent: {
    color: '#A85E2B',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 22,
    height: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: 3,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#A85E2B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

