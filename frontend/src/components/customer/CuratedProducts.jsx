import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import ProductCard from './ProductCard';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function CuratedProducts({
  products = [],
  wishlistIds = new Set(),
  loading = false,
  onProductPress,
  onWishlistToggle,
  onArtisanPress,
  onViewAllPress,
}) {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Curated for You</Text>
        <TouchableOpacity
          onPress={onViewAllPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="View all curated products"
        >
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={ShilpColors.primary} size="small" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found matching your search.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {products.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              isWishlisted={wishlistIds.has(item.id)}
              onPress={onProductPress}
              onWishlistPress={onWishlistToggle}
              onArtisanPress={onArtisanPress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A85E2B',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  loadingContainer: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    color: ShilpColors.textSecondary,
    textAlign: 'center',
  },
});

