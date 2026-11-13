import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const menuIcon = require('@/assets/images/shilpsetu/icon-menu.svg');
const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const bellIcon = require('@/assets/images/shilpsetu/icon-bell.svg');
const cartIcon = require('@/assets/images/shilpsetu/icon-cart.svg');

export default function HomeHeader({
  onMenuPress,
  onNotificationPress,
  onCartPress,
  cartCount = 2,
  notificationCount = 1,
}) {
  return (
    <View style={styles.container}>
      {/* Left: Hamburger menu */}
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.iconButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <Image source={menuIcon} style={styles.navIcon} contentFit="contain" />
      </TouchableOpacity>

      {/* Center: ShilpSetu brand with lotus emblem */}
      <View style={styles.brandContainer}>
        <Image source={lotusLogo} style={styles.lotusLogo} contentFit="contain" />
        <Text style={styles.brandTitle}>
          <Text style={styles.brandShilp}>Shilp</Text>
          <Text style={styles.brandSetu}>Setu</Text>
        </Text>
      </View>

      {/* Right: Notifications & Cart */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          onPress={onNotificationPress}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Image source={bellIcon} style={styles.actionIcon} contentFit="contain" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCartPress}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Shopping Cart"
        >
          <Image source={cartIcon} style={styles.actionIcon} contentFit="contain" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: ShilpColors.background,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navIcon: {
    width: 22,
    height: 22,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotusLogo: {
    width: 26,
    height: 24,
    marginRight: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  brandShilp: {
    color: ShilpColors.text,
  },
  brandSetu: {
    color: ShilpColors.secondary,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 22,
    height: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: ShilpColors.primary,
    borderRadius: 8,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

