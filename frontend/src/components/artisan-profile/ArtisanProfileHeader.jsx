import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const checkIcon = require('@/assets/images/shilpsetu/icon-check.svg');
const starIcon = require('@/assets/images/shilpsetu/icon-star.svg');
const locationIcon = require('@/assets/images/shilpsetu/icon-location.svg');
const userPlusIcon = require('@/assets/images/shilpsetu/icon-user-plus.svg');
const defaultPottery = require('@/assets/images/shilpsetu/icon-pottery.svg');
const mandalaPattern = require('@/assets/images/shilpsetu/top-right-decor.svg');

export default function ArtisanProfileHeader({
  artisan,
  isFollowing = false,
  onFollowToggle,
}) {
  if (!artisan) return null;

  return (
    <View style={styles.container}>
      {/* Subtle traditional mandala decorative motif in top right */}
      <View style={styles.mandalaWrapper} pointerEvents="none">
        <Image
          source={mandalaPattern}
          style={styles.mandalaImage}
          contentFit="contain"
        />
      </View>

      <View style={styles.profileRow}>
        {/* Circular Avatar with verification badge overlay */}
        <View style={styles.avatarContainer}>
          <Image
            source={
              artisan.avatar_url
                ? { uri: artisan.avatar_url }
                : defaultPottery
            }
            style={styles.avatarImage}
            contentFit="cover"
          />
          {artisan.is_verified && (
            <View style={styles.verifiedBadge}>
              <Image source={checkIcon} style={styles.checkIcon} contentFit="contain" />
            </View>
          )}
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.artisanName} numberOfLines={2}>
              {artisan.name}
            </Text>
            {artisan.is_verified && (
              <View style={styles.inlineVerified}>
                <Image source={checkIcon} style={styles.inlineCheck} contentFit="contain" />
              </View>
            )}
          </View>

          {/* Craft Specialization */}
          <Text style={styles.specializationText} numberOfLines={1}>
            {artisan.craft_type || artisan.craft_specialty || 'Traditional Artisan'}
          </Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Image source={locationIcon} style={styles.locationIcon} contentFit="contain" />
            <Text style={styles.locationText} numberOfLines={1}>
              {artisan.location || 'India'}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Image source={starIcon} style={styles.starIcon} contentFit="contain" />
            <Text style={styles.ratingText}>
              {artisan.rating ? Number(artisan.rating).toFixed(1) : '4.8'}
            </Text>
            <Text style={styles.reviewsCountText}>
              ({artisan.reviews_count || 126} reviews)
            </Text>
          </View>
        </View>

        {/* Follow / Following Button */}
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
          ]}
          onPress={onFollowToggle}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isFollowing ? 'Following artisan' : 'Follow artisan'}
        >
          {!isFollowing && (
            <Image source={userPlusIcon} style={styles.followIcon} contentFit="contain" />
          )}
          <Text
            style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText,
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  mandalaWrapper: {
    position: 'absolute',
    top: -10,
    right: -20,
    width: 140,
    height: 140,
    opacity: 0.18,
  },
  mandalaImage: {
    width: '100%',
    height: '100%',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 82,
    height: 82,
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F0E4D4',
    borderWidth: 2,
    borderColor: '#E5D7C5',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#263C29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F8F0E3',
  },
  checkIcon: {
    width: 11,
    height: 11,
    tintColor: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artisanName: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 19,
    fontWeight: '700',
    color: '#263C29',
    lineHeight: 24,
  },
  inlineVerified: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#263C29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCheck: {
    width: 9,
    height: 9,
    tintColor: '#FFFFFF',
  },
  specializationText: {
    fontSize: 13,
    color: '#25251F',
    fontWeight: '500',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationIcon: {
    width: 12,
    height: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#8A8275',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  starIcon: {
    width: 12,
    height: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25251F',
  },
  reviewsCountText: {
    fontSize: 11,
    color: '#8A8275',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#263C29',
    backgroundColor: '#FBF5EB',
  },
  followingButton: {
    backgroundColor: '#263C29',
  },
  followIcon: {
    width: 14,
    height: 14,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#263C29',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
});

