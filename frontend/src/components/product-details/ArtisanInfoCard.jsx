import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const iconArrowRight = require('@/assets/images/shilpsetu/icon-arrow-right.svg');
const defaultPotteryIcon = require('@/assets/images/shilpsetu/icon-pottery.svg');

export default function ArtisanInfoCard({
  artisanName = 'Ramesh Bhai',
  location = 'Kutch, Gujarat',
  avatarUrl = null,
  onViewArtisan,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Artisan Avatar */}
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Image
              source={defaultPotteryIcon}
              style={styles.defaultAvatarIcon}
              contentFit="contain"
            />
          )}
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <Text style={styles.byLabel}>
            By <Text style={styles.artisanName}>{artisanName}</Text>
          </Text>
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {location}
          </Text>
        </View>

        {/* View Artisan Button with Arrow */}
        <TouchableOpacity
          style={styles.viewButton}
          onPress={onViewArtisan}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`View ${artisanName} artisan profile`}
        >
          <Text style={styles.viewText}>View Artisan</Text>
          <Image
            source={iconArrowRight}
            style={styles.arrowIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 12,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0E4D4',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  defaultAvatarIcon: {
    width: 28,
    height: 28,
  },
  infoCol: {
    flex: 1,
  },
  byLabel: {
    fontSize: 14,
    color: '#8A8275',
  },
  artisanName: {
    fontWeight: '700',
    color: '#25251F',
  },
  locationText: {
    fontSize: 12,
    color: '#8A8275',
    marginTop: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A85E2B',
  },
  arrowIcon: {
    width: 14,
    height: 14,
    tintColor: '#A85E2B',
  },
});

