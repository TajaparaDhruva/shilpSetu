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
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import ArtisanInfoCard from './ArtisanInfoCard';
import ProductDescription from './ProductDescription';
import ProductHighlights from './ProductHighlights';
import QuantitySelector from './QuantitySelector';
import ProductActionBar from './ProductActionBar';

import { getProductDetails, getProductRating } from '@/services/productService';
import {
  getWishlist,
  toggleWishlist as toggleUserWishlist,
  isInWishlist,
} from '@/services/wishlistService';
import { addToCart, getCartCount } from '@/services/cartService';

export default function ProductDetailsScreen({ productId: propProductId }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = propProductId || params?.id || 'prod-pot-1';

  // Product Data States
  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartCount, setCartCount] = useState(getCartCount());

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState(null);

  // Fetch product data
  const loadProductData = useCallback(async () => {
    try {
      setError(null);
      const data = await getProductDetails(productId);
      if (data) {
        setProduct(data);
        // Check wishlist status
        const inWish = isInWishlist(data.id);
        setIsWishlisted(inWish);
      } else {
        setError('Craft item not found.');
      }
    } catch (err) {
      setError('Unable to load product details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProductData();
  }, [loadProductData]);

  // Wishlist toggle
  const handleWishlistToggle = async () => {
    if (!product) return;
    const res = await toggleUserWishlist(product.id);
    setIsWishlisted(res.inWishlist);
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!product) return;
    if (product.stock !== undefined && product.stock <= 0) {
      Alert.alert('Notice', 'This item is currently out of stock.');
      return;
    }

    try {
      setIsAddingToCart(true);
      const res = await addToCart(product, quantity);
      if (res.success) {
        setCartCount(res.totalItems);
        Alert.alert(
          'Added to Cart',
          `Added ${quantity} × "${product.name}" to your shopping bag.`,
          [{ text: 'Continue Shopping' }]
        );
      } else {
        Alert.alert('Notice', res.error || 'Failed to add item to cart.');
      }
    } catch {
      Alert.alert('Notice', 'Unable to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // View Artisan
  const handleViewArtisan = () => {
    if (!product) return;
    const aId = product.artisan_id || 'artisan-ramesh-1';
    router.push(`/(customer)/artisan/${aId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#F8F0E3" />
        <ExploreHeader cartCount={cartCount} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#263C29" />
          <Text style={styles.loadingText}>Loading handcrafted craft details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#F8F0E3" />
        <ExploreHeader cartCount={cartCount} />
        <View style={styles.centerLoading}>
          <Text style={styles.errorTitle}>Product Unavailable</Text>
          <Text style={styles.errorSubtitle}>{error || 'The product you requested could not be found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F8F0E3" />

      {/* Top Header */}
      <ExploreHeader
        cartCount={cartCount}
        onCartPress={() =>
          Alert.alert('Shopping Cart', `You have ${cartCount} item(s) in your bag.`)
        }
        onNotificationPress={() =>
          Alert.alert('Notifications', 'No new notifications.')
        }
      />

      {/* Main Scroll Content */}
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
        {/* A. Product Image Gallery with Thumbnails & Overlay Icons */}
        <ProductImageGallery
          images={product.image_urls}
          imageKey={product.imageKey}
          productName={product.name}
          selectedImageIndex={selectedImageIndex}
          onSelectImage={setSelectedImageIndex}
          isWishlisted={isWishlisted}
          onWishlistPress={handleWishlistToggle}
        />

        {/* B. Product Information (Title, Rating, Price, Discount) */}
        <ProductInfo
          name={product.name}
          price={product.price}
          originalPrice={product.original_price}
          rating={product.rating}
          reviewsCount={product.reviews_count}
        />

        {/* C. Artisan Information Card */}
        <ArtisanInfoCard
          artisanName={product.artisan_name}
          location={
            product.artisan_location ||
            product.artisan_profile?.location ||
            'Kutch, Gujarat'
          }
          avatarUrl={product.artisan_avatar}
          onViewArtisan={handleViewArtisan}
        />

        {/* D. Product Description */}
        <ProductDescription description={product.description} />

        {/* E. Product Highlights (Handmade, Eco-Friendly, Durable) */}
        <ProductHighlights />

        {/* F. Quantity Selector */}
        <QuantitySelector
          quantity={quantity}
          stock={product.stock !== undefined ? product.stock : 10}
          onChangeQuantity={setQuantity}
        />

        {/* Spacing for fixed bottom action bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* G. Fixed Bottom Action Bar */}
      <ProductActionBar
        isWishlisted={isWishlisted}
        isOutOfStock={isOutOfStock}
        isAddingToCart={isAddingToCart}
        onWishlistPress={handleWishlistToggle}
        onAddToCartPress={handleAddToCart}
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
    paddingBottom: 80, // Prevent content from being hidden behind action bar
  },
  bottomSpacer: {
    height: 36,
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

