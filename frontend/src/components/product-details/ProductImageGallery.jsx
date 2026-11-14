import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const heartOutline = require('@/assets/images/shilpsetu/icon-heart.svg');
const heartFilled = require('@/assets/images/shilpsetu/icon-heart-filled.svg');
const shareIcon = require('@/assets/images/shilpsetu/icon-share.svg');

const colWoodcrafts = require('@/assets/images/shilpsetu/col-woodcrafts.svg');
const colHandlooms = require('@/assets/images/shilpsetu/col-handlooms.svg');
const colAccessories = require('@/assets/images/shilpsetu/col-accessories.svg');
const bannerPottery = require('@/assets/images/shilpsetu/banner-pottery.svg');

const FALLBACK_IMAGE_MAP = {
  woodcrafts: colWoodcrafts,
  handlooms: colHandlooms,
  accessories: colAccessories,
  pottery: bannerPottery,
};

export default function ProductImageGallery({
  images = [],
  imageKey = 'pottery',
  productName = 'Handmade Craft',
  selectedImageIndex = 0,
  onSelectImage,
  isWishlisted = false,
  onWishlistPress,
}) {
  const fallbackImg = FALLBACK_IMAGE_MAP[imageKey] || bannerPottery;

  // Compile list of image sources: support real image URIs or fallback asset
  const galleryImages =
    images && images.length > 0
      ? images
      : [fallbackImg];

  const currentMainImage = galleryImages[selectedImageIndex] || galleryImages[0] || fallbackImg;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${productName}" crafted by authentic Indian artisans on ShilpSetu!`,
        title: productName,
      });
    } catch {
      // Ignore dismiss
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Image Container */}
      <View style={styles.mainImageContainer}>
        <Image
          source={
            typeof currentMainImage === 'string'
              ? { uri: currentMainImage }
              : currentMainImage
          }
          style={styles.mainImage}
          contentFit="cover"
          accessibilityLabel={productName}
        />

        {/* Action Buttons: Wishlist & Share in top-right */}
        <View style={styles.overlayActions}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={onWishlistPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Image
              source={isWishlisted ? heartFilled : heartOutline}
              style={styles.actionIcon}
              contentFit="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleShare}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Share product"
          >
            <Image
              source={shareIcon}
              style={styles.actionIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Thumbnails Row */}
      {galleryImages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailRow}
        >
          {galleryImages.map((img, idx) => {
            const isSelected = idx === selectedImageIndex;
            return (
              <TouchableOpacity
                key={`thumb-${idx}`}
                style={[
                  styles.thumbnailWrapper,
                  isSelected && styles.thumbnailWrapperSelected,
                ]}
                onPress={() => onSelectImage && onSelectImage(idx)}
                activeOpacity={0.8}
              >
                <Image
                  source={typeof img === 'string' ? { uri: img } : img}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  mainImageContainer: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    backgroundColor: '#F0E4D4',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  overlayActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 245, 235, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionIcon: {
    width: 18,
    height: 18,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  thumbnailWrapper: {
    width: 72,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5D7C5',
    backgroundColor: '#F0E4D4',
  },
  thumbnailWrapperSelected: {
    borderColor: '#263C29',
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

