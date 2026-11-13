import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import ExploreProductCard from './ExploreProductCard';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const lotusDivider = require('@/assets/images/shilpsetu/lotus-divider.svg');

export default function ExploreProductGrid({
  products = [],
  wishlistIds = new Set(),
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  onProductPress,
  onWishlistPress,
  onAddToCart,
  ListHeaderComponent,
}) {
  const renderItem = ({ item }) => {
    const isWishlisted = wishlistIds.has(item.id);
    return (
      <View style={styles.cardWrapper}>
        <ExploreProductCard
          product={item}
          isWishlisted={isWishlisted}
          onPress={onProductPress}
          onWishlistPress={onWishlistPress}
          onAddToCart={onAddToCart}
        />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={lotusDivider}
          style={styles.emptyIcon}
          contentFit="contain"
        />
        <Text style={styles.emptyTitle}>No crafts found</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your search query, selecting another category, or resetting filters.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return <View style={styles.footerSpacing} />;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#263C29" />
        <Text style={styles.loadingText}>Loading more crafts...</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item, index) => item.id || `prod-${index}`}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 90, // Avoid overlapping with bottom navigation
  },
  columnWrapper: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 60,
    height: 30,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A8275',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#8A8275',
  },
  footerSpacing: {
    height: 16,
  },
});

