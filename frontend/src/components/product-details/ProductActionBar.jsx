import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const heartOutline = require('@/assets/images/shilpsetu/icon-heart.svg');
const heartFilled = require('@/assets/images/shilpsetu/icon-heart-filled.svg');
const iconCart = require('@/assets/images/shilpsetu/icon-cart.svg');

export default function ProductActionBar({
  isWishlisted = false,
  isOutOfStock = false,
  isAddingToCart = false,
  onWishlistPress,
  onAddToCartPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.barContainer,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Add to Wishlist Button */}
        <TouchableOpacity
          style={[
            styles.wishlistButton,
            isWishlisted && styles.wishlistButtonActive,
          ]}
          onPress={onWishlistPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
          }
        >
          <Image
            source={isWishlisted ? heartFilled : heartOutline}
            style={styles.wishlistIcon}
            contentFit="contain"
          />
          <Text
            style={[
              styles.wishlistText,
              isWishlisted && styles.wishlistTextActive,
            ]}
          >
            {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
          </Text>
        </TouchableOpacity>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[
            styles.cartButton,
            isOutOfStock && styles.cartButtonDisabled,
          ]}
          onPress={onAddToCartPress}
          disabled={isOutOfStock || isAddingToCart}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add to cart"
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Image
                source={iconCart}
                style={styles.cartIcon}
                contentFit="contain"
              />
              <Text style={styles.cartButtonText}>
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: '#FBF5EB',
    borderTopWidth: 1,
    borderTopColor: '#E5D7C5',
    paddingTop: 12,
    paddingHorizontal: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wishlistButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBF5EB',
    borderWidth: 1.5,
    borderColor: '#263C29',
  },
  wishlistButtonActive: {
    backgroundColor: '#F0E4D4',
  },
  wishlistIcon: {
    width: 18,
    height: 18,
  },
  wishlistText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263C29',
  },
  wishlistTextActive: {
    color: '#A85E2B',
  },
  cartButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#263C29',
  },
  cartButtonDisabled: {
    backgroundColor: '#8A8275',
    opacity: 0.6,
  },
  cartIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

