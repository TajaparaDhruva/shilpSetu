import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExploreHeader from '@/components/explore/ExploreHeader';
import CustomerBottomNavigation from '@/components/customer/CustomerBottomNavigation';
import OrderFilterTabs from '@/components/orders/OrderFilterTabs';
import OrderCard from '@/components/orders/OrderCard';
import EmptyOrders from '@/components/orders/EmptyOrders';
import OrderReviewForm from '@/components/orders/OrderReviewForm';
import { getMyOrders } from '@/services/orderService';
import { getCartCount } from '@/services/cartService';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function MyOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Review modal state
  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const count = await getCartCount();
      setCartCount(count || 0);
    } catch (err) {
      console.warn('Failed to fetch cart count:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCart();
  }, [fetchOrders, fetchCart]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    fetchCart();
  };

  // Filter orders based on active filter tab
  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'All Orders') return true;
    const st = (order.order_status || order.status || '').toLowerCase();

    if (activeFilter === 'Processing') {
      return st === 'processing' || st === 'ordered' || st === 'confirmed' || st === 'packed';
    }
    if (activeFilter === 'Shipped') {
      return st === 'shipped' || st === 'out for delivery' || st === 'out_for_delivery';
    }
    if (activeFilter === 'Delivered') {
      return st === 'delivered' || st === 'completed';
    }
    if (activeFilter === 'Cancelled') {
      return st === 'cancelled' || st === 'refunded';
    }
    return true;
  });

  const handleOpenReview = (order) => {
    // Pick the first product from the order
    const firstItem = order.order_items?.[0] || order.items?.[0];
    const product = firstItem?.products || firstItem?.product || firstItem;
    setSelectedProductForReview({
      id: product?.id || firstItem?.product_id,
      title: product?.title || product?.name || 'Handcrafted Art',
      orderId: order.id,
      orderNumber: order.order_number,
    });
    setReviewVisible(true);
  };

  const handleTabPress = (tabKey) => {
    if (tabKey === 'home') {
      router.push('/(customer)/home');
    } else if (tabKey === 'explore') {
      router.push('/(customer)/explore');
    } else if (tabKey === 'orders') {
      // already here
    } else if (tabKey === 'wishlist') {
      // navigate or alert
    } else if (tabKey === 'profile') {
      router.push('/role-setup');
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F0E3" />

      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
        <ExploreHeader
          cartCount={cartCount}
          onCartPress={() => router.push('/(customer)/cart')}
          onNotificationPress={() => {}}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ShilpColors.primary || '#263C29'}
          />
        }
      >
        {/* Page Heading matching screenshot */}
        <View style={styles.headingSection}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>
            Track, manage and view your past orders
          </Text>
        </View>

        {/* Filter Chips */}
        <OrderFilterTabs
          selected={activeFilter}
          onSelect={(tab) => setActiveFilter(tab)}
        />

        {/* Loading Spinner */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ShilpColors.primary || '#263C29'} />
          </View>
        ) : filteredOrders.length === 0 ? (
          <EmptyOrders
            filter={activeFilter}
            onContinueShopping={() => router.push('/(customer)/explore')}
          />
        ) : (
          <View style={styles.orderList}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/(customer)/orders/${order.id}`)}
                onRateReview={handleOpenReview}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <CustomerBottomNavigation
        activeTab="orders"
        onTabPress={handleTabPress}
      />

      {/* Rate & Review Modal */}
      <OrderReviewForm
        visible={reviewVisible}
        onClose={() => setReviewVisible(false)}
        productId={selectedProductForReview?.id}
        productName={selectedProductForReview?.title}
        orderId={selectedProductForReview?.orderId}
        onSuccess={() => {
          fetchOrders();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  headingSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6E6B65',
    marginTop: 4,
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});

