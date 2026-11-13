import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const locationIcon = require('@/assets/images/shilpsetu/icon-location.svg');
const videoIcon = require('@/assets/images/shilpsetu/icon-video.svg');
const arrowRight = require('@/assets/images/shilpsetu/icon-arrow-right.svg');
const potteryIcon = require('@/assets/images/shilpsetu/cat-pottery.svg');
const leafIcon = require('@/assets/images/shilpsetu/cat-homedecor.svg');
const handIcon = require('@/assets/images/shilpsetu/icon-pottery.svg');
const terracottaPot = require('@/assets/images/shilpsetu/terracotta-pot.svg');

export default function ArtisanAboutTab({
  story,
  specialties = ['Terracotta', 'Eco-Friendly', 'Handmade'],
  location = 'Kutch, Gujarat',
  storyVideoUrl = null,
  onWatchStory,
}) {
  const handleOpenVideo = () => {
    if (onWatchStory) {
      onWatchStory();
    } else if (storyVideoUrl) {
      Linking.openURL(storyVideoUrl).catch(() => {});
    }
  };

  const getTagIcon = (tag) => {
    const t = tag.toLowerCase();
    if (t.includes('pot') || t.includes('terra')) return potteryIcon;
    if (t.includes('eco') || t.includes('nature')) return leafIcon;
    return handIcon;
  };

  return (
    <View style={styles.container}>
      {/* 1. About the Artisan Section with decorative pottery illustration */}
      <View style={styles.aboutCard}>
        <View style={styles.textColumn}>
          <Text style={styles.sectionHeading}>About the Artisan</Text>
          <Text style={styles.storyText}>
            {story ||
              'I am a traditional artisan preserving the ancient heritage of Indian handicrafts for decades. Each piece is crafted with natural raw materials and time-honored artisanal techniques.'}
          </Text>
        </View>

        {/* Traditional pottery sketch on right side */}
        <View style={styles.illustrationWrapper} pointerEvents="none">
          <Image
            source={terracottaPot}
            style={styles.illustrationImage}
            contentFit="contain"
          />
        </View>
      </View>

      {/* 2. Craft Speciality Tags */}
      <View style={styles.specialitySection}>
        <Text style={styles.subHeading}>Craft Speciality</Text>
        <View style={styles.tagRow}>
          {specialties.map((tag, idx) => (
            <View key={`tag-${idx}`} style={styles.tagBadge}>
              <Image source={getTagIcon(tag)} style={styles.tagIcon} contentFit="contain" />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 3. Workshop Location & Watch Story Video Row */}
      <View style={styles.actionCardsRow}>
        <View style={styles.workshopCard}>
          <Image source={locationIcon} style={styles.cardLocationIcon} contentFit="contain" />
          <View>
            <Text style={styles.cardLabel}>Workshop</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>

        {storyVideoUrl && (
          <TouchableOpacity
            style={styles.storyVideoCard}
            onPress={handleOpenVideo}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Watch artisan story video"
          >
            <Image source={videoIcon} style={styles.videoIcon} contentFit="contain" />
            <Text style={styles.storyVideoText}>Watch My Story</Text>
            <Image source={arrowRight} style={styles.arrowIcon} contentFit="contain" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  aboutCard: {
    position: 'relative',
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 14,
    overflow: 'hidden',
    minHeight: 120,
  },
  textColumn: {
    maxWidth: '74%',
  },
  sectionHeading: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 6,
  },
  storyText: {
    fontSize: 13,
    color: '#4A463E',
    lineHeight: 20,
  },
  illustrationWrapper: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 80,
    height: 80,
    opacity: 0.85,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  specialitySection: {
    marginTop: 14,
  },
  subHeading: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 17,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagIcon: {
    width: 14,
    height: 14,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#25251F',
  },
  actionCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  workshopCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  cardLocationIcon: {
    width: 18,
    height: 18,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#263C29',
  },
  cardValue: {
    fontSize: 11,
    color: '#8A8275',
  },
  storyVideoCard: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
  },
  videoIcon: {
    width: 16,
    height: 16,
  },
  storyVideoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A85E2B',
  },
  arrowIcon: {
    width: 12,
    height: 12,
    tintColor: '#A85E2B',
  },
});

