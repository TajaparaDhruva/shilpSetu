import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

import ExploreHeader from '@/components/explore/ExploreHeader';
import ArtisanProfileHeader from './ArtisanProfileHeader';
import ArtisanStatistics from './ArtisanStatistics';
import ArtisanProfileTabs from './ArtisanProfileTabs';
import ArtisanAboutTab from './ArtisanAboutTab';
import ArtisanProductsTab from './ArtisanProductsTab';
import ArtisanReviewsTab from './ArtisanReviewsTab';
import ArtisanActionButtons from './ArtisanActionButtons';
import CustomerBottomNavigation from '@/components/customer/CustomerBottomNavigation';

import { getProductArtisan, searchProducts } from '@/services/productService';
import {
  getWishlist,
  toggleWishlist as toggleUserWishlist,
} from '@/services/wishlistService';
import { getCartCount } from '@/services/cartService';

export default function ArtisanProfileScreen({ artisanId: propArtisanId }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const artisanId = propArtisanId || params?.id || 'artisan-ramesh-1';

  // State
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [isFollowing, setIsFollowing] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [cartCount, setCartCount] = useState(getCartCount());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load Artisan Data
  const loadArtisanData = useCallback(async () => {
    try {
      setError(null);
      const [artisanData, artisanProducts, userWishlist] = await Promise.all([
        getProductArtisan(artisanId),
        searchProducts(null, { inStockOnly: true }),
        getWishlist(),
      ]);

      if (artisanData) {
        setArtisan({
          ...artisanData,
          rating: artisanData.rating || 4.8,
          reviews_count: artisanData.reviews_count || 126,
          is_verified: artisanData.is_verified !== undefined ? artisanData.is_verified : true,
          productsCount: artisanData.productsCount || 42,
          customersCount: artisanData.customersCount || '1,250+',
          experienceYears: artisanData.experienceYears || '5 Years',
          specialties: artisanData.specialties || ['Terracotta', 'Eco-Friendly', 'Handmade'],
          storyVideoUrl: artisanData.storyVideoUrl || 'https://www.youtube.com',
        });
      } else {
        setError('Artisan profile not found.');
      }

      // Filter products belonging to this artisan
      const filtered = artisanProducts.filter(
        (p) =>
          p.artisan_id === artisanId ||
          p.artisan_name?.toLowerCase().includes('ramesh') ||
          p.category_name?.toLowerCase().includes('pot')
      );
      setProducts(filtered.length > 0 ? filtered : artisanProducts.slice(0, 4));

      if (Array.isArray(userWishlist)) {
        const idSet = new Set();
        userWishlist.forEach((item) => {
          if (item.product_id) idSet.add(item.product_id);
          else if (typeof item === 'string') idSet.add(item);
        });
        setWishlistIds(idSet);
      }
    } catch {
      setError('Unable to load artisan profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [artisanId]);

  useEffect(() => {
    loadArtisanData();
  }, [loadArtisanData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadArtisanData();
  }, [loadArtisanData]);

  // Follow Toggle
  const handleFollowToggle = () => {
    const next = !isFollowing;
    setIsFollowing(next);
    Alert.alert(
      next ? 'Following' : 'Unfollowed',
      next
        ? `You are now following ${artisan?.name || 'this artisan'}. You will receive updates on new handcrafted items.`
        : `Unfollowed ${artisan?.name || 'this artisan'}.`
    );
  };

  // Product Tap
  const handleProductPress = (product) => {
    if (product?.id) {
      router.push(`/(customer)/product/${product.id}`);
    }
  };

  // Wishlist Toggle
  const handleWishlistPress = async (product) => {
    const res = await toggleUserWishlist(product.id);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (res.inWishlist) next.add(product.id);
      else next.delete(product.id);
      return next;
    });
  };

  // Chat with Artisan
  const handleChatPress = () => {
    Alert.alert(
      'Artisan Direct Chat',
      `Direct messaging with ${artisan?.name || 'this artisan'} will open here.`
    );
  };

  // View All Products
  const handleViewAllProducts = () => {
    router.push({
      pathname: '/(customer)/explore',
      params: { query: artisan?.name || '' },
    });
  };

  // Bottom navigation tab click
  const handleTabPress = (tabKey) => {
    if (tabKey === 'home') {
      router.replace('/(customer)/home');
    } else if (tabKey === 'explore') {
      router.replace('/(customer)/explore');
    } else if (tabKey === 'wishlist') {
      Alert.alert('Wishlist', `You have ${wishlistIds.size} saved items.`);
    } else if (tabKey === 'orders') {
      Alert.alert('My Orders', 'Your orders list is coming soon.');
    } else if (tabKey === 'profile') {
      // Already on profile
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#F8F0E3" />
        <ExploreHeader cartCount={cartCount} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#263C29" />
          <Text style={styles.loadingText}>Loading artisan profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !artisan) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#F8F0E3" />
        <ExploreHeader cartCount={cartCount} />
        <View style={styles.centerLoading}>
          <Text style={styles.errorTitle}>Profile Unavailable</Text>
          <Text style={styles.errorSubtitle}>{error || 'Artisan profile could not be found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F8F0E3" />

      {/* A. Header */}
      <ExploreHeader
        cartCount={cartCount}
        onCartPress={() =>
          Alert.alert('Shopping Cart', `You have ${cartCount} item(s) in your bag.`)
        }
        onNotificationPress={() =>
          Alert.alert('Notifications', 'No new notifications.')
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#263C29"
            colors={['#263C29']}
          />
        }
      >
        {/* B. Artisan Profile Header */}
        <ArtisanProfileHeader
          artisan={artisan}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
        />

        {/* C. Artisan Statistics */}
        <ArtisanStatistics
          productsCount={artisan.productsCount}
          customersCount={artisan.customersCount}
          experienceYears={artisan.experienceYears}
        />

        {/* D. Profile Tabs (About, Products, Reviews) */}
        <ArtisanProfileTabs
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />

        {/* Tab Content */}
        {activeTab === 'about' && (
          <ArtisanAboutTab
            story={artisan.public_description}
            specialties={artisan.specialties}
            location={artisan.location}
            storyVideoUrl={artisan.storyVideoUrl}
          />
        )}

        {activeTab === 'products' && (
          <ArtisanProductsTab
            products={products}
            wishlistIds={wishlistIds}
            onProductPress={handleProductPress}
            onWishlistPress={handleWishlistPress}
            onViewAll={handleViewAllProducts}
          />
        )}

        {activeTab === 'reviews' && (
          <ArtisanReviewsTab
            rating={artisan.rating}
            reviewsCount={artisan.reviews_count}
            reviews={[
              {
                id: 'r1',
                reviewer_name: 'Ananya Sharma',
                rating: 5.0,
                comment: 'The terracotta finish is pristine! Truly authentic craftsmanship and packaged safely.',
              },
              {
                id: 'r2',
                reviewer_name: 'Vikram Joshi',
                rating: 4.8,
                comment: 'Beautiful traditional clay work. Adds warmth and cultural elegance to our living space.',
              },
            ]}
          />
        )}

        {/* F. Featured Products (visible under About tab matching reference design) */}
        {activeTab === 'about' && (
          <ArtisanProductsTab
            products={products}
            wishlistIds={wishlistIds}
            onProductPress={handleProductPress}
            onWishlistPress={handleWishlistPress}
            onViewAll={handleViewAllProducts}
          />
        )}

        {/* G. Bottom Action Buttons: Chat with Artisan & View Products */}
        <ArtisanActionButtons
          onChatPress={handleChatPress}
          onViewProductsPress={handleViewAllProducts}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* H. Customer Bottom Navigation with Profile tab highlighted */}
      <CustomerBottomNavigation
        activeTab="profile"
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 85, // Avoid overlapping with bottom navigation
  },
  bottomSpacer: {
    height: 10,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8A8275',
  },
  errorTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 22,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#8A8275',
    textAlign: 'center',
  },
});

