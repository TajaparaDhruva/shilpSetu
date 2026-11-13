import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import HomeHeader from './HomeHeader';
import HomeSearchBar from './HomeSearchBar';
import HomeBannerCarousel from './HomeBannerCarousel';
import CategoryList from './CategoryList';
import FeaturedCollections from './FeaturedCollections';
import CuratedProducts from './CuratedProducts';
import CustomerBottomNavigation from './CustomerBottomNavigation';

import { ShilpColors } from '@/constants/shilpSetuTheme';
import {
  fetchCategories,
  fetchFeaturedCollections,
  fetchCuratedProducts,
  searchProducts,
  fetchProductsByCategory,
  toggleWishlist,
  isInWishlist,
} from '@/services/productService';
import { logout } from '@/services/auth';

export default function CustomerHomeScreen() {
  const router = useRouter();

  // State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [cats, cols, prods] = await Promise.all([
        fetchCategories(),
        fetchFeaturedCollections(),
        fetchCuratedProducts(),
      ]);

      setCategories(cats);
      setCollections(cols);
      setProducts(prods);
    } catch {
      // Fallbacks handle error gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchQuery('');
    setSelectedCategory(null);
    loadData();
  }, [loadData]);

  // Search handler
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      if (selectedCategory) {
        const filtered = await fetchProductsByCategory(selectedCategory);
        setProducts(filtered);
      } else {
        const curated = await fetchCuratedProducts();
        setProducts(curated);
      }
      return;
    }

    const results = await searchProducts(text);
    setProducts(results);
  };

  // Category filter
  const handleSelectCategory = async (cat) => {
    if (selectedCategory === cat.name) {
      setSelectedCategory(null);
      const curated = await fetchCuratedProducts();
      setProducts(curated);
    } else {
      setSelectedCategory(cat.name);
      const filtered = await fetchProductsByCategory(cat.name);
      setProducts(filtered);
    }
  };

  // Wishlist toggle
  const handleWishlistToggle = async (product) => {
    const isNowWishlisted = await toggleWishlist(product.id);
    setWishlistIds((prev) => {
      const updated = new Set(prev);
      if (isNowWishlisted) {
        updated.add(product.id);
      } else {
        updated.delete(product.id);
      }
      return updated;
    });
  };

  // Product tap
  const handleProductPress = (product) => {
    Alert.alert(
      product.name,
      `Crafted by: ${product.artisan_name}\nPrice: ₹${product.price}\nRating: ${product.rating} ★\n\nFull product details view is coming soon!`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  // Artisan profile tap
  const handleArtisanPress = (product) => {
    Alert.alert(
      product.artisan_name,
      `Dedicated Indian Artisan practicing traditional ${product.category_name || 'handicrafts'}.\n\nArtisan store page is coming soon!`,
      [{ text: 'OK' }]
    );
  };

  // Collection tap
  const handleCollectionPress = (col) => {
    handleSelectCategory({ name: col.name });
  };

  // Bottom tab tap
  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);

    if (tabKey === 'profile') {
      Alert.alert(
        'Account & Profile',
        'Would you like to log out of ShilpSetu?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setActiveTab('home') },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/login');
            },
          },
        ]
      );
    } else if (tabKey === 'categories') {
      Alert.alert('Categories', 'Browse all handcrafted Indian categories.');
    } else if (tabKey === 'orders') {
      Alert.alert('My Orders', 'You have no past orders yet.');
    } else if (tabKey === 'wishlist') {
      Alert.alert('My Wishlist', `${wishlistIds.size} item(s) saved in your wishlist.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />

      {/* 1. Top Navigation Header */}
      <HomeHeader
        onMenuPress={() =>
          Alert.alert(
            'ShilpSetu Menu',
            '• Explore Artisans\n• State Craft Heritage\n• About ShilpSetu\n• Contact & Support',
            [{ text: 'Close' }]
          )
        }
        onNotificationPress={() =>
          Alert.alert('Notifications', '🎉 Welcome to ShilpSetu! Discover authentic handicrafts direct from rural Indian artisans.')
        }
        onCartPress={() =>
          Alert.alert('Shopping Cart', 'Your shopping cart has 2 item(s).\n\nProceed to checkout coming soon!')
        }
      />

      {/* 2. Search Bar */}
      <HomeSearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        onFilterPress={() =>
          Alert.alert(
            'Filter Handicrafts',
            'Filter by Price, State of Origin, or Artisan Rating.',
            [{ text: 'OK' }]
          )
        }
      />

      {/* Main Scrollable Feed */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ShilpColors.primary}
            colors={[ShilpColors.primary]}
          />
        }
      >
        {/* 3. Promotional Banner Carousel */}
        <HomeBannerCarousel
          onShopNowPress={(banner) => {
            Alert.alert(
              banner.highlight,
              'Showing exclusive authentic craft collection.',
              [{ text: 'OK' }]
            );
          }}
        />

        {/* 4. Product Categories */}
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* 5. Featured Collections */}
        <FeaturedCollections
          collections={collections}
          onSelectCollection={handleCollectionPress}
          onViewAllPress={() =>
            Alert.alert('Featured Collections', 'All state-wise artisan collections.')
          }
        />

        {/* 6. Curated for You */}
        <CuratedProducts
          products={products}
          wishlistIds={wishlistIds}
          loading={loading}
          onProductPress={handleProductPress}
          onWishlistToggle={handleWishlistToggle}
          onArtisanPress={handleArtisanPress}
          onViewAllPress={() =>
            Alert.alert('Curated Handicrafts', 'All curated master crafts.')
          }
        />

        {/* Bottom spacer for the fixed bottom navigation bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 7. Bottom Navigation */}
      <CustomerBottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ShilpColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bottomSpacer: {
    height: 70,
  },
});

