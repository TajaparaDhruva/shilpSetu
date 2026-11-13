import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import ExploreHeader from './ExploreHeader';
import ExploreSearchBar from './ExploreSearchBar';
import ExploreCategories, { EXPLORE_CATEGORIES } from './ExploreCategories';
import SortDropdown from './SortDropdown';
import ProductFilterModal from './ProductFilterModal';
import ExploreProductGrid from './ExploreProductGrid';
import CustomerBottomNavigation from '@/components/customer/CustomerBottomNavigation';

import {
  getCuratedProducts,
  getProductsByCategory,
  searchProducts,
} from '@/services/productService';
import {
  getWishlist,
  toggleWishlist as toggleUserWishlist,
} from '@/services/wishlistService';
import { addToCart, getCartCount } from '@/services/cartService';

export default function ExploreScreen() {
  const router = useRouter();

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: null,
    maxPrice: null,
    category: null,
    inStockOnly: true,
    minRating: null,
  });

  // Data States
  const [allFetchedProducts, setAllFetchedProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [cartCount, setCartCount] = useState(getCartCount());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load wishlist & products with backend search, filter, and sort
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      const activeFilters = {
        ...filters,
        category: selectedCategory && selectedCategory !== 'all' ? selectedCategory : filters.category,
      };

      const prods = await searchProducts(
        searchQuery,
        activeFilters,
        selectedSort,
        1,
        30
      );

      setAllFetchedProducts(prods);

      // Load user wishlist
      const userWishlist = await getWishlist();
      if (Array.isArray(userWishlist)) {
        const idSet = new Set();
        userWishlist.forEach((item) => {
          if (item.product_id) idSet.add(item.product_id);
          else if (typeof item === 'string') idSet.add(item);
        });
        setWishlistIds(idSet);
      }
    } catch {
      // Fallback handlers keep UI running smoothly
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, filters, selectedSort]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInitialData();
  }, [loadInitialData]);

  // Handle Search Input Change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  // Handle Category selection
  const handleCategorySelect = (categorySlug) => {
    setSelectedCategory(categorySlug);
    // Also sync filter modal category
    setFilters((prev) => ({
      ...prev,
      category: categorySlug === 'all' ? null : categorySlug,
    }));
  };

  // Filter application
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    if (newFilters.category) {
      setSelectedCategory(newFilters.category.toLowerCase());
    }
  };

  // Wishlist toggle
  const handleWishlistPress = async (product) => {
    const res = await toggleUserWishlist(product.id);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (res.inWishlist) {
        next.add(product.id);
      } else {
        next.delete(product.id);
      }
      return next;
    });
  };

  // Add to cart
  const handleAddToCart = async (product) => {
    const result = await addToCart(product, 1);
    if (result.success) {
      setCartCount(result.totalItems);
      Alert.alert(
        'Added to Cart',
        `"${product.name}" has been added to your shopping bag.`,
        [{ text: 'Continue Shopping' }]
      );
    } else {
      Alert.alert('Notice', result.error || 'Could not add to cart.');
    }
  };

  // Product press: Navigate to product details
  const handleProductPress = (product) => {
    if (product && product.id) {
      router.push(`/(customer)/product/${product.id}`);
    }
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== null) count++;
    if (filters.maxPrice !== null) count++;
    if (filters.category && filters.category !== 'All') count++;
    if (filters.minRating !== null) count++;
    return count;
  }, [filters]);

  // Client-side filtering & sorting
  const processedProducts = useMemo(() => {
    let list = [...allFetchedProducts];

    // 1. Text Search (if fallback or client refinement)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.artisan_name?.toLowerCase().includes(q) ||
          p.category_name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (selectedCategory && selectedCategory !== 'all') {
      const cat = selectedCategory.toLowerCase();
      list = list.filter(
        (p) =>
          p.category_name?.toLowerCase().includes(cat) ||
          p.category?.toLowerCase().includes(cat) ||
          p.imageKey?.toLowerCase().includes(cat)
      );
    }

    // 3. Price Filter
    if (filters.minPrice !== null) {
      list = list.filter((p) => p.price >= filters.minPrice);
    }
    if (filters.maxPrice !== null) {
      list = list.filter((p) => p.price <= filters.maxPrice);
    }

    // 4. In Stock Filter
    if (filters.inStockOnly) {
      list = list.filter((p) => (p.stock === undefined || p.stock > 0));
    }

    // 5. Min Rating Filter
    if (filters.minRating !== null) {
      list = list.filter((p) => (p.rating || 4.8) >= filters.minRating);
    }

    // 6. Sorting
    switch (selectedSort) {
      case 'newest':
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'price_low_high':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price_high_low':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'highest_rated':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
      default:
        list.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
        break;
    }

    return list;
  }, [allFetchedProducts, searchQuery, selectedCategory, filters, selectedSort]);

  // Bottom navigation tab click
  const handleTabPress = (tabKey) => {
    if (tabKey === 'home') {
      router.replace('/(customer)/home');
    } else if (tabKey === 'explore' || tabKey === 'categories') {
      // Already on Explore / Categories
    } else if (tabKey === 'wishlist') {
      Alert.alert('Wishlist', `You have ${wishlistIds.size} saved items.`);
    } else if (tabKey === 'orders') {
      router.push('/(customer)/orders');
    } else if (tabKey === 'profile') {
      Alert.alert('Customer Profile', 'Profile options coming soon.');
    }
  };

  // Header Component for the FlatList
  const ListHeader = () => (
    <View style={styles.headerBlock}>
      {/* Page Heading & Subtitle */}
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>
          Explore <Text style={styles.pageTitleAccent}>Crafts</Text>
        </Text>
        <Text style={styles.pageSubtitle}>
          Search, filter and discover unique handmade products
        </Text>
      </View>

      {/* Rounded Search Bar */}
      <ExploreSearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onFilterPress={() => setFilterModalVisible(true)}
      />

      {/* Horizontal Category Selector */}
      <ExploreCategories
        categories={EXPLORE_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      {/* Sort By Dropdown & Filter Trigger Row */}
      <SortDropdown
        selectedSort={selectedSort}
        onSelectSort={setSelectedSort}
        onOpenFilter={() => setFilterModalVisible(true)}
        activeFilterCount={activeFilterCount}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F8F0E3" />

      {/* Top Header */}
      <ExploreHeader
        cartCount={cartCount}
        onCartPress={() => router.push('/(customer)/cart')}
        onNotificationPress={() =>
          Alert.alert('Notifications', 'No new notifications.')
        }
      />

      {/* Product Grid with integrated Header */}
      <ExploreProductGrid
        products={processedProducts}
        wishlistIds={wishlistIds}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onProductPress={handleProductPress}
        onWishlistPress={handleWishlistPress}
        onAddToCart={handleAddToCart}
        ListHeaderComponent={ListHeader}
      />

      {/* Filter Bottom Sheet Modal */}
      <ProductFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />

      {/* Persistent ShilpSetu Bottom Navigation with Explore tab highlighted */}
      <CustomerBottomNavigation
        activeTab="explore"
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
  headerBlock: {
    backgroundColor: '#F8F0E3',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  pageTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 28,
    fontWeight: '700',
    color: '#263C29',
    letterSpacing: 0.2,
  },
  pageTitleAccent: {
    color: '#A85E2B',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#8A8275',
    marginTop: 4,
    lineHeight: 18,
  },
});

