import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import ExploreHeader from '@/components/explore/ExploreHeader';
import CustomerBottomNavigation from '@/components/customer/CustomerBottomNavigation';
import ProductCard from '@/components/customer/ProductCard';
import { ShilpColors } from '@/constants/shilpSetuTheme';

import { getWishlist, removeFromWishlist } from '@/services/wishlistService';
import { addToCart, getCartCount } from '@/services/cartService';

const heartOutline = require('@/assets/images/shilpsetu/icon-heart.svg');

export default function WishlistScreen() {
  const router = useRouter();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(getCartCount());

  const loadWishlistData = useCallback(async () => {
    try {
      const items = await getWishlist();
      setWishlistItems(Array.isArray(items) ? items : []);
      setCartCount(getCartCount());
    } catch {
      setWishlistItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWishlistData();
  }, [loadWishlistData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWishlistData();
  }, [loadWishlistData]);

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
    setWishlistItems((prev) => prev.filter((item) => (item.product?.id || item.product_id) !== productId));
  };

  const handleAddToCart = async (product) => {
    const res = await addToCart(product, 1);
    if (res.success) {
      setCartCount(getCartCount());
      Alert.alert('Added to Cart', `"${product.name || 'Product'}" has been added to your cart.`);
    } else {
      Alert.alert('Notice', res.error || 'Could not add to cart.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />

      {/* Header */}
      <ExploreHeader
        cartCount={cartCount}
        onCartPress={() => router.push('/(customer)/cart')}
        onNotificationPress={() => Alert.alert('Notifications', 'No new notifications.')}
      />

      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>My Wishlist</Text>
        <Text style={styles.pageSubtitle}>Saved handcrafted creations</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ShilpColors.primary} />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Image source={heartOutline} style={styles.emptyHeart} contentFit="contain" />
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite handcrafted products to easily find them later!
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(customer)/explore')}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreBtnText}>Discover Crafts</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ShilpColors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {wishlistItems.map((item, idx) => {
              const product = item.product || { id: item.product_id, name: 'Handcrafted Item', price: 0 };
              return (
                <View key={product.id || idx} style={styles.cardCol}>
                  <ProductCard
                    product={product}
                    isWishlisted={true}
                    onPress={() => router.push(`/(customer)/product/${product.id}`)}
                    onWishlistPress={() => handleRemove(product.id)}
                  />
                  <TouchableOpacity
                    style={styles.moveCartBtn}
                    onPress={() => handleAddToCart(product)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.moveCartText}>Move to Cart</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <CustomerBottomNavigation
        activeTab="wishlist"
        onTabPress={(tabKey) => {
          if (tabKey === 'home') router.replace('/(customer)/home');
          else if (tabKey === 'explore') router.replace('/(customer)/explore');
          else if (tabKey === 'orders') router.replace('/(customer)/orders');
          else if (tabKey === 'profile') router.replace('/(customer)/home');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  pageTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 26,
    fontWeight: '700',
    color: '#263C29',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#7A6E5D',
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7A6E5D',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0E4D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyHeart: {
    width: 36,
    height: 36,
    tintColor: '#A85E2B',
  },
  emptyTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 22,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B6459',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: '#263C29',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardCol: {
    width: '48%',
    marginBottom: 16,
  },
  moveCartBtn: {
    backgroundColor: '#263C29',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  moveCartText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

