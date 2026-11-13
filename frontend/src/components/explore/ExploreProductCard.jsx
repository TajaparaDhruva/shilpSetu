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
const iconCart = require('@/assets/images/shilpsetu/icon-cart.svg');

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

export default function ExploreProductCard({
  product,
  isWishlisted = false,
  onPress,
  onWishlistPress,
  onAddToCart,
}) {
  const imageSource =
    (product.image_urls && product.image_urls.length > 0 && { uri: product.image_urls[0] }) ||
    IMAGE_MAP[product.imageKey] ||
    colWoodcrafts;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress && onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, Price ₹${product.price}`}
    >
      {/* Product Image Area */}
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

      {/* Details Container */}
      <View style={styles.detailsContainer}>
        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>

        {/* Price & Add to Cart Button Row */}
        <View style={styles.priceCartRow}>
          <Text style={styles.priceText}>
            ₹{Number(product.price).toLocaleString('en-IN')}
          </Text>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={styles.cartButton}
            activeOpacity={0.8}
            onPress={() => onAddToCart && onAddToCart(product)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
          >
            <Image
              source={iconCart}
              style={styles.cartIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Star Rating & Review Count */}
        <View style={styles.ratingRow}>
          <Image source={starIcon} style={styles.starIcon} contentFit="contain" />
          <Text style={styles.ratingText}>
            {product.rating?.toFixed(1) || '4.8'}
          </Text>
          <Text style={styles.reviewsText}>
            ({product.reviews_count || 42})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    overflow: 'hidden',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F0E4D4',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 245, 235, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    width: 16,
    height: 16,
  },
  detailsContainer: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#25251F',
    marginBottom: 6,
  },
  priceCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25251F',
  },
  cartButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#263C29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    width: 15,
    height: 15,
    tintColor: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIcon: {
    width: 12,
    height: 12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#25251F',
  },
  reviewsText: {
    fontSize: 11,
    color: '#8A8275',
  },
});

