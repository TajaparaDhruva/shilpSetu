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

const heartOutline = require('@/assets/images/shilpsetu/icon-heart.svg');
const heartFilled = require('@/assets/images/shilpsetu/icon-heart-filled.svg');

const colWoodcrafts = require('@/assets/images/shilpsetu/col-woodcrafts.svg');
const colHandlooms = require('@/assets/images/shilpsetu/col-handlooms.svg');
const colAccessories = require('@/assets/images/shilpsetu/col-accessories.svg');
const bannerPottery = require('@/assets/images/shilpsetu/banner-pottery.svg');

const IMAGE_MAP = {
  woodcrafts: colWoodcrafts,
  handlooms: colHandlooms,
  accessories: colAccessories,
  pottery: bannerPottery,
};

export default function ArtisanProductCard({
  product,
  isWishlisted = false,
  onPress,
  onWishlistPress,
}) {
  const imageSource =
    (product.image_urls && product.image_urls.length > 0 && { uri: product.image_urls[0] }) ||
    IMAGE_MAP[product.imageKey] ||
    bannerPottery;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress && onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, Price ₹${product.price}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.productImage}
          contentFit="cover"
        />

        {/* Wishlist Heart Icon Top-Right */}
        <TouchableOpacity
          style={styles.wishlistButton}
          activeOpacity={0.8}
          onPress={() => onWishlistPress && onWishlistPress(product)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Image
            source={isWishlisted ? heartFilled : heartOutline}
            style={styles.heartIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.priceText}>
          ₹{Number(product.price).toLocaleString('en-IN')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#FBF5EB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    overflow: 'hidden',
    marginRight: 12,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0E4D4',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(251, 245, 235, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    width: 14,
    height: 14,
  },
  detailsContainer: {
    padding: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#25251F',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A85E2B',
  },
});

