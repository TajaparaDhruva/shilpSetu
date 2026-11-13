import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const menuIcon = require('@/assets/images/shilpsetu/icon-menu.svg');
const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const bellIcon = require('@/assets/images/shilpsetu/icon-bell.svg');
const defaultPottery = require('@/assets/images/shilpsetu/icon-pottery.svg');

export default function ArtisanDashboardHeader({
  onMenuPress,
  onNotificationPress,
  onProfilePress,
  hasUnreadNotification = true,
  artisanAvatar = null,
  isOnline = true,
}) {
  return (
    <View style={styles.container}>
      {/* Left: Hamburger menu */}
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.iconButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Open navigation menu"
      >
        <Image source={menuIcon} style={styles.navIcon} contentFit="contain" />
      </TouchableOpacity>

      {/* Center: ShilpSetu Brand Title with Lotus Logo */}
      <View style={styles.brandContainer}>
        <Image source={lotusLogo} style={styles.lotusLogo} contentFit="contain" />
        <Text style={styles.brandTitle}>
          <Text style={styles.brandShilp}>Shilp</Text>
          <Text style={styles.brandSetu}>Setu</Text>
        </Text>
      </View>

      {/* Right: Notifications & Profile with Online indicator */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          onPress={onNotificationPress}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Image source={bellIcon} style={styles.bellIcon} contentFit="contain" />
          {hasUnreadNotification && <View style={styles.notificationDot} />}
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity
          onPress={onProfilePress}
          style={styles.avatarButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="View profile"
        >
          <View style={styles.avatarWrapper}>
            <Image
              source={
                artisanAvatar && typeof artisanAvatar === 'string' && artisanAvatar.startsWith('http')
                  ? { uri: artisanAvatar }
                  : defaultPottery
              }
              style={styles.avatarImage}
              contentFit="cover"
            />
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F0E3',
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotusLogo: {
    width: 30,
    height: 30,
    marginRight: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  brandShilp: {
    color: ShilpColors.primaryText || '#25251F',
  },
  brandSetu: {
    color: ShilpColors.secondary || '#A85E2B',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    width: 22,
    height: 22,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ShilpColors.secondary || '#A85E2B',
    borderWidth: 1.5,
    borderColor: '#F8F0E3',
  },
  avatarButton: {
    marginLeft: 10,
  },
  avatarWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#E5D7C5',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF5EB',
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#287A3D',
    borderWidth: 2,
    borderColor: '#F8F0E3',
  },
});

