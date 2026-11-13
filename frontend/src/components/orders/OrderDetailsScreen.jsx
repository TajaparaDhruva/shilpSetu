import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExploreHeader from '@/components/explore/ExploreHeader';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import OrderTrackingTimeline from '@/components/orders/OrderTrackingTimeline';
import OrderProductInfo from '@/components/orders/OrderProductInfo';
import OrderPriceSummary from '@/components/orders/OrderPriceSummary';
import OrderReviewForm from '@/components/orders/OrderReviewForm';
import { getOrderDetails, cancelOrder } from '@/services/orderService';
import { getCartCount } from '@/services/cartService';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.id;
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Review modal state
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await getOrderDetails(orderId);
      setOrder(data);
    } catch (err) {
      console.warn('Failed to fetch order details:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDetails();
    getCartCount().then((cnt) => setCartCount(cnt || 0)).catch(() => {});
  }, [fetchDetails]);

  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? Any payment made will be refunded to your source account.',
      [
        { text: 'No, Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await cancelOrder(orderId, 'Customer requested cancellation');
              if (res.success) {
                Alert.alert('Order Cancelled', 'Your order has been successfully cancelled.');
                fetchDetails();
              } else {
                Alert.alert('Error', res.error || 'Unable to cancel this order.');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel order.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleRateProduct = (item) => {
    const product = item.products || item.product || item;
    setReviewItem({
      id: product?.id || item.product_id,
      title: product?.title || product?.name || 'Handcrafted Art',
      orderId: order?.id,
    });
    setReviewVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={ShilpColors.primary || '#263C29'} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>Order not found.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/(customer)/orders')}
        >
          <Text style={styles.backBtnText}>Back to My Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = order.order_status || order.status || 'ordered';
  const isCancelled = status.toLowerCase() === 'cancelled';
  const isDelivered = status.toLowerCase() === 'delivered' || status.toLowerCase() === 'completed';
  const canCancel = !isCancelled && !isDelivered;

  // Format order date
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const address = order.shipping_address || order.address;
  const items = order.order_items || order.items || [];

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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Header Card */}
        <View style={styles.card}>
          <View style={styles.orderTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
              {dateStr ? <Text style={styles.orderDate}>{dateStr}</Text> : null}
            </View>
            <OrderStatusBadge status={status} />
          </View>

          {/* Tracking Timeline */}
          <View style={styles.timelineWrap}>
            <OrderTrackingTimeline
              status={status}
              trackingSteps={order.tracking_steps}
              deliveryEstimate={order.delivery_estimate}
              cancelledAt={order.cancelled_at}
              cancellationReason={order.cancellation_reason}
            />
          </View>
        </View>

        {/* Product Items List */}
        <OrderProductInfo
          items={items}
          canReview={isDelivered}
          onRateReview={handleRateProduct}
          onPressProduct={(prodId) => {
            if (prodId) router.push(`/(customer)/product/${prodId}`);
          }}
        />

        {/* Shipping Address */}
        {address && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addressName}>{address.full_name}</Text>
            <Text style={styles.addressLine}>
              {address.address_line_1}
              {address.address_line_2 ? `, ${address.address_line_2}` : ''}
            </Text>
            <Text style={styles.addressLine}>
              {address.city}, {address.state} - {address.pincode}
            </Text>
            {address.phone ? <Text style={styles.addressPhone}>Phone: {address.phone}</Text> : null}
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method</Text>
            <Text style={styles.infoValue}>
              {(order.payment_method || 'UPI').toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text
              style={[
                styles.infoValue,
                { color: order.payment_status === 'paid' ? '#287A3D' : '#A85E2B' },
              ]}
            >
              {(order.payment_status || 'Paid').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Price Summary */}
        <OrderPriceSummary
          subtotal={order.subtotal || order.total_amount}
          discount={order.discount_amount || 0}
          couponDiscount={order.coupon_discount || 0}
          deliveryCharge={order.shipping_fee ?? order.delivery_charge ?? 49}
          total={order.total_amount}
          itemCount={items.length}
        />

        {/* Cancel Order Action */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={handleCancelPress}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#C94A29" size="small" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Review Modal */}
      <OrderReviewForm
        visible={reviewVisible}
        onClose={() => setReviewVisible(false)}
        productId={reviewItem?.id}
        productName={reviewItem?.title}
        orderId={order.id}
        onSuccess={() => fetchDetails()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 16,
    marginBottom: 12,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
  },
  orderDate: {
    fontSize: 12,
    color: '#8A8478',
    marginTop: 2,
  },
  timelineWrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFE3D5',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 10,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    color: '#6E6B65',
    lineHeight: 18,
  },
  addressPhone: {
    fontSize: 13,
    color: '#6E6B65',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6E6B65',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#F9D8D0',
    backgroundColor: '#FFF5F3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  cancelBtnText: {
    color: '#C94A29',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    color: '#6E6B65',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: ShilpColors.primary || '#263C29',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

