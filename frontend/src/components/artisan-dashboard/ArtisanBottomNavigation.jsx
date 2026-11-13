import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: '🏛️' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'orders', label: 'Orders', icon: '🛍️' },
  { key: 'earnings', label: 'Earnings', icon: '📊' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

export default function ArtisanBottomNavigation({
  activeTab = 'dashboard',
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
            <Text style={[styles.tabIcon, isActive ? styles.activeIcon : styles.inactiveIcon]}>
              {tab.icon}
            </Text>
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
        shadowColor: '#25251F',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 56,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  inactiveIcon: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  activeLabel: {
    color: ShilpColors.primary || '#263C29',
    fontWeight: '700',
  },
  inactiveLabel: {
    color: '#6E6B65',
  },
});

