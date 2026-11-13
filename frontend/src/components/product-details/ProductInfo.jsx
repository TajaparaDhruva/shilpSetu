import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import ProductRating from './ProductRating';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function ProductInfo({
  name = 'Product Title',
  price = 799,
  originalPrice = 999,
  rating = 4.8,
  reviewsCount = 126,
}) {
  const numPrice = Number(price || 0);
  const numOrigPrice = originalPrice ? Number(originalPrice) : null;

  // Calculate discount percentage if original price is greater than selling price
  let discountPercent = null;
  if (numOrigPrice && numOrigPrice > numPrice) {
    discountPercent = Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100);
  }

  return (
    <View style={styles.container}>
      {/* Title & Rating Row */}
      <View style={styles.titleRow}>
        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>
        <ProductRating rating={rating} reviewsCount={reviewsCount} />
      </View>

      {/* Price, Original Price & Discount Tag */}
      <View style={styles.priceRow}>
        <Text style={styles.sellingPrice}>₹{numPrice.toLocaleString('en-IN')}</Text>

        {numOrigPrice && (
          <Text style={styles.originalPrice}>
            ₹{numOrigPrice.toLocaleString('en-IN')}
          </Text>
        )}

        {discountPercent !== null && discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% Off</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  productName: {
    flex: 1,
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 22,
    fontWeight: '700',
    color: '#263C29',
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  sellingPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#A85E2B',
  },
  originalPrice: {
    fontSize: 16,
    color: '#8A8275',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#E5D7C5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#263C29',
  },
});

