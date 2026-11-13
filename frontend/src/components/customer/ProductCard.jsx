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
const starIcon = require('@/assets/images/shilpsetu/icon-star.svg');

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

export default function ProductCard({
  product,
  isWishlisted = false,
  onPress,
  onWishlistPress,
  onArtisanPress,
}) {
  const imageSource = IMAGE_MAP[product.imageKey] || colWoodcrafts;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress && onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, Price ₹${product.price}`}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.productImage}
          contentFit="cover"
        />

        {/* Wishlist Heart Button in top-right */}
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

      {/* Details Container */}
      <View style={styles.detailsContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>

        <TouchableOpacity
          onPress={() => onArtisanPress && onArtisanPress(product)}
          activeOpacity={0.7}
        >
          <Text style={styles.artisanName} numberOfLines={1}>
            By {product.artisan_name}
          </Text>
        </TouchableOpacity>

        {/* Price & Rating Row */}
        <View style={styles.priceRatingRow}>
          <Text style={styles.priceText}>
            ₹{product.price.toLocaleString('en-IN')}
          </Text>

          <View style={styles.ratingBadge}>
            <Image source={starIcon} style={styles.starIcon} contentFit="contain" />
            <Text style={styles.ratingText}>
              {product.rating?.toFixed(1) || '4.8'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#EDE4D6',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    width: 14,
    height: 14,
  },
  detailsContainer: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: ShilpColors.text,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif-medium' }),
    marginBottom: 3,
  },
  artisanName: {
    fontSize: 11,
    color: '#827869',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 8,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 12,
    height: 12,
    marginRight: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A463F',
  },
});

