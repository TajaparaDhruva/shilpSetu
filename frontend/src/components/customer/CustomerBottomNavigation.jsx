import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const navHome = require('@/assets/images/shilpsetu/nav-home.svg');
const navCategories = require('@/assets/images/shilpsetu/nav-categories.svg');
const navOrders = require('@/assets/images/shilpsetu/nav-orders.svg');
const navWishlist = require('@/assets/images/shilpsetu/nav-wishlist.svg');
const navProfile = require('@/assets/images/shilpsetu/nav-profile.svg');

const TABS = [
  { key: 'home', label: 'Home', icon: navHome },
  { key: 'explore', label: 'Explore', icon: navCategories },
  { key: 'orders', label: 'Orders', icon: navOrders },
  { key: 'wishlist', label: 'Wishlist', icon: navWishlist },
  { key: 'profile', label: 'Profile', icon: navProfile },
];

export default function CustomerBottomNavigation({
  activeTab = 'home',
  onTabPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            activeOpacity={0.7}
            onPress={() => onTabPress && onTabPress(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
          >
            <Image
              source={tab.icon}
              style={[
                styles.tabIcon,
                isActive ? styles.activeIcon : styles.inactiveIcon,
              ]}
              contentFit="contain"
            />
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderTopWidth: 1,
    borderTopColor: '#E8DED2',
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  tabIcon: {
    width: 22,
    height: 22,
    marginBottom: 4,
  },
  activeIcon: {
    tintColor: '#263C29',
  },
  inactiveIcon: {
    tintColor: '#6B6459',
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  activeLabel: {
    color: '#263C29',
    fontWeight: '700',
  },
  inactiveLabel: {
    color: '#6B6459',
    fontWeight: '500',
  },
});

