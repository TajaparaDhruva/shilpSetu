import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import ArtisanProductCard from './ArtisanProductCard';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const arrowRight = require('@/assets/images/shilpsetu/icon-arrow-right.svg');

export default function ArtisanProductsTab({
  products = [],
  wishlistIds = new Set(),
  onProductPress,
  onWishlistPress,
  onViewAll,
}) {
  return (
    <View style={styles.container}>
      {/* Featured Products Heading & View All Row */}
      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Featured Products</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Image source={arrowRight} style={styles.arrowIcon} contentFit="contain" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Products Scroll */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products listed yet by this artisan.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {products.map((product) => (
            <ArtisanProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.has(product.id)}
              onPress={onProductPress}
              onWishlistPress={onWishlistPress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A85E2B',
  },
  arrowIcon: {
    width: 12,
    height: 12,
    tintColor: '#A85E2B',
  },
  scrollList: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#8A8275',
  },
});

