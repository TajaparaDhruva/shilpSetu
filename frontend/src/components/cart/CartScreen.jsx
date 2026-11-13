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

import ExploreHeader from '@/components/explore/ExploreHeader';
import CartItemCard from './CartItemCard';
import CouponCard from './CouponCard';
import PriceSummary from './PriceSummary';
import EmptyCart from './EmptyCart';
import CustomerBottomNavigation from '@/components/customer/CustomerBottomNavigation';

import { getCart, getCartCount, addToCart } from '@/services/cartService';
import {
  getAppliedCoupon,
  applyCoupon,
  removeCoupon,
} from '@/services/couponService';
import {
  calculatePriceSummary,
  validateCartForCheckout,
} from '@/services/checkoutService';
import { getCurrentUser } from '@/services/auth.js';

export default function CartScreen() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [priceSummary, setPriceSummary] = useState({
    itemTotal: 0,
    productDiscount: 0,
    couponDiscount: 0,
    deliveryCharge: 49,
    totalAmount: 0,
  });

  const loadCartData = useCallback(async () => {
    try {
      const items = await getCart();
      const coupon = getAppliedCoupon();
      setCartItems(Array.isArray(items) ? items : []);
      setAppliedCoupon(coupon);

      const deliveryCharge = items?.length > 0 ? 49 : 0;
      const couponDiscount = coupon?.discount_amount || 0;
      const summary = calculatePriceSummary(items || [], deliveryCharge, couponDiscount);
      setPriceSummary(summary);
    } catch {
      // In-memory fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCartData();
  }, [loadCartData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCartData();
  }, [loadCartData]);

  // Quantity Change
  const handleQuantityChange = async (productId, newQty) => {
    const item = cartItems.find((i) => (i.product?.id || i.product_id) === productId);
    if (!item) return;

    const diff = newQty - item.quantity;
    if (diff === 0) return;

    const res = await addToCart(item.product || { id: productId }, diff);
    if (res.success) {
      await loadCartData();
    } else {
      Alert.alert('Stock Notice', res.error || 'Cannot update quantity');
    }
  };

  // Remove Item
  const handleRemoveItem = async (productId) => {
    Alert.alert('Remove Item', 'Do you want to remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const item = cartItems.find((i) => (i.product?.id || i.product_id) === productId);
          if (item) {
            await addToCart(item.product || { id: productId }, -item.quantity);
            await loadCartData();
          }
        },
      },
    ]);
  };

  // Coupon Handlers
  const handleApplyCoupon = async (code) => {
    const res = await applyCoupon(code, priceSummary.itemTotal);
    if (res.valid) {
      setAppliedCoupon(res);
      const summary = calculatePriceSummary(cartItems, 49, res.discount_amount);
      setPriceSummary(summary);
      Alert.alert('Success', `Coupon ${code.toUpperCase()} applied! Saved ₹${res.discount_amount}.`);
    } else {
      Alert.alert('Invalid Coupon', res.error || 'This coupon cannot be applied.');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setAppliedCoupon(null);
    const summary = calculatePriceSummary(cartItems, 49, 0);
    setPriceSummary(summary);
  };

  // Proceed to Checkout
  const handleProceedToCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart is Empty', 'Please add items to your cart before proceeding.');
      return;
    }

    const validation = await validateCartForCheckout(cartItems);
    if (!validation.valid) {
      Alert.alert('Checkout Notice', validation.message || 'Some items are unavailable.');
      return;
    }

    const user = await getCurrentUser();
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to complete your checkout.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }

    router.push('/(customer)/checkout');
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#F8F0E3" />
        <ExploreHeader cartCount={0} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#263C29" />
          <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F8F0E3" />

      {/* Header */}
      <ExploreHeader
        cartCount={totalCartCount}
        onCartPress={() => {}}
        onNotificationPress={() => Alert.alert('Notifications', 'No new notifications.')}
      />

      {cartItems.length === 0 ? (
        <EmptyCart onContinueShopping={() => router.push('/(customer)/explore')} />
      ) : (
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
          {/* Title matching screenshot */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              My Cart <Text style={styles.itemCountText}>({totalCartCount} Items)</Text>
            </Text>
          </View>

          {/* Product List */}
          {cartItems.map((item, idx) => (
            <CartItemCard
              key={item.id || item.product?.id || `cart-${idx}`}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem}
              onProductPress={(id) => router.push(`/(customer)/product/${id}`)}
            />
          ))}

          {/* Coupon Section */}
          <CouponCard
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
          />

          {/* Price Details */}
          <PriceSummary
            itemTotal={priceSummary.itemTotal}
            productDiscount={priceSummary.productDiscount}
            couponDiscount={priceSummary.couponDiscount}
            deliveryCharge={priceSummary.deliveryCharge}
            totalAmount={priceSummary.totalAmount}
          />

          {/* Proceed to Checkout Button */}
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleProceedToCheckout}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout →</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Bottom navigation */}
      <CustomerBottomNavigation
        activeTab="orders"
        onTabPress={(tabKey) => {
          if (tabKey === 'home') router.replace('/(customer)/home');
          else if (tabKey === 'explore') router.replace('/(customer)/explore');
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  titleRow: {
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 26,
    fontWeight: '700',
    color: '#263C29',
  },
  itemCountText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 16,
    fontWeight: '400',
    color: '#6B6459',
  },
  checkoutButton: {
    backgroundColor: '#263C29',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#263C29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
});

