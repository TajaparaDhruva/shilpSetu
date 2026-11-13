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

import {
  getArtisanProfile,
  getArtisanStatistics,
  getFeaturedArtisanProducts,
  getArtisanReviews,
} from '@/services/artisanService';
import {
  isFollowingArtisan,
  followArtisan,
  unfollowArtisan,
} from '@/services/artisanFollowService';
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
  const [statistics, setStatistics] = useState({
    productsCount: 0,
    customersCount: '0',
    experienceYears: '1 Year',
  });
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load Artisan Data
  const loadArtisanData = useCallback(async () => {
    try {
      setError(null);

      // Parallel fetch: profile + statistics + products + reviews + wishlist + follow state
      const [
        artisanData,
        statsData,
        featuredProducts,
        artisanReviews,
        userWishlist,
        followingStatus,
        cartItemCount,
      ] = await Promise.all([
        getArtisanProfile(artisanId),
        getArtisanStatistics(artisanId),
        getFeaturedArtisanProducts(artisanId, 6),
        getArtisanReviews(artisanId, 1, 10),
        getWishlist(),
        isFollowingArtisan(artisanId),
        Promise.resolve(getCartCount()),
      ]);

      if (artisanData) {
        setArtisan({
          ...artisanData,
          rating: artisanData.rating || 4.8,
          reviews_count: artisanData.reviews_count || 0,
          is_verified: artisanData.is_verified !== undefined ? artisanData.is_verified : true,
          specialties: artisanData.specialties || artisanData.craft_specialties || ['Handmade'],
          storyVideoUrl: artisanData.storyVideoUrl || artisanData.story_video_url || null,
          public_description:
            artisanData.public_description ||
            artisanData.biography ||
            artisanData.description ||
            '',
        });
      } else {
        setError('Artisan profile not found.');
      }

      setStatistics({
        productsCount: statsData?.productsCount ?? 0,
        customersCount: statsData?.customersCount ?? '0',
        experienceYears: statsData?.experienceYears ?? '1 Year',
      });

      setProducts(Array.isArray(featuredProducts) ? featuredProducts : []);
      setReviews(Array.isArray(artisanReviews) ? artisanReviews : []);
      setIsFollowing(Boolean(followingStatus));
      setCartCount(Number(cartItemCount) || 0);

      if (Array.isArray(userWishlist)) {
        const idSet = new Set();
        userWishlist.forEach((item) => {
          if (item?.product_id) idSet.add(item.product_id);
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

  // Follow Toggle — calls real service
  const handleFollowToggle = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    // Optimistic update
    setIsFollowing(!wasFollowing);
    try {
      const result = wasFollowing
        ? await unfollowArtisan(artisanId)
        : await followArtisan(artisanId);

      if (result?.success === false) {
        // Revert if failed
        setIsFollowing(wasFollowing);
        Alert.alert('Error', result.error || 'Could not update follow status.');
      } else {
        const name = artisan?.name || artisan?.business_name || 'this artisan';
        Alert.alert(
          !wasFollowing ? 'Following' : 'Unfollowed',
          !wasFollowing
            ? `You are now following ${name}. You will receive updates on new handcrafted items.`
            : `Unfollowed ${name}.`
        );
      }
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setFollowLoading(false);
    }
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
      if (res?.inWishlist) next.add(product.id);
      else next.delete(product.id);
      return next;
    });
  };

  // Chat with Artisan
  const handleChatPress = () => {
    Alert.alert(
      'Artisan Direct Chat',
      `Direct messaging with ${artisan?.name || artisan?.business_name || 'this artisan'} will open here.`
    );
  };

  // View All Products
  const handleViewAllProducts = () => {
    router.push({
      pathname: '/(customer)/explore',
      params: { query: artisan?.name || artisan?.business_name || '' },
    });
  };

  // Bottom navigation
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
        onCartPress={() => router.push('/(customer)/cart')}
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
          followLoading={followLoading}
          onFollowToggle={handleFollowToggle}
        />

        {/* C. Artisan Statistics */}
        <ArtisanStatistics
          productsCount={statistics.productsCount}
          customersCount={statistics.customersCount}
          experienceYears={statistics.experienceYears}
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
            location={artisan.location || `${artisan.city || ''}, ${artisan.state || ''}`.trim().replace(/^,\s*|,\s*$/, '')}
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
            reviews={reviews}
          />
        )}

        {/* F. Featured Products section visible under About tab */}
        {activeTab === 'about' && (
          <ArtisanProductsTab
            products={products}
            wishlistIds={wishlistIds}
            onProductPress={handleProductPress}
            onWishlistPress={handleWishlistPress}
            onViewAll={handleViewAllProducts}
          />
        )}

        {/* G. Bottom Action Buttons */}
        <ArtisanActionButtons
          onChatPress={handleChatPress}
          onViewProductsPress={handleViewAllProducts}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* H. Customer Bottom Navigation */}
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
    paddingBottom: 85,
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
