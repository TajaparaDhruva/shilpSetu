import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const navProfile = require('@/assets/images/shilpsetu/nav-profile.svg');
const catAll = require('@/assets/images/shilpsetu/cat-all.svg');
const starIcon = require('@/assets/images/shilpsetu/icon-star.svg');

export const TABS = [
  { key: 'about', label: 'About', icon: navProfile },
  { key: 'products', label: 'Products', icon: catAll },
  { key: 'reviews', label: 'Reviews', icon: starIcon },
];

export default function ArtisanProfileTabs({
  activeTab = 'about',
  onTabPress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                isActive ? styles.tabButtonActive : styles.tabButtonInactive,
              ]}
              onPress={() => onTabPress && onTabPress(tab.key)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Image
                source={tab.icon}
                style={[
                  styles.tabIcon,
                  isActive ? styles.tabIconActive : styles.tabIconInactive,
                ]}
                contentFit="contain"
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
  },
  tabButtonActive: {
    backgroundColor: '#263C29',
    borderColor: '#263C29',
  },
  tabButtonInactive: {
    backgroundColor: '#FBF5EB',
    borderColor: '#E5D7C5',
  },
  tabIcon: {
    width: 16,
    height: 16,
  },
  tabIconActive: {
    tintColor: '#FFFFFF',
  },
  tabIconInactive: {
    tintColor: '#263C29',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    color: '#25251F',
  },
});

