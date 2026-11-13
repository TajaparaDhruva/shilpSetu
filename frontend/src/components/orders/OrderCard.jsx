import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import OrderStatusBadge from './OrderStatusBadge';
import OrderTrackingTimeline from './OrderTrackingTimeline';

const colWoodcrafts = require('@/assets/images/shilpsetu/col-woodcrafts.svg');
const colHandlooms = require('@/assets/images/shilpsetu/col-handlooms.svg');
const colAccessories = require('@/assets/images/shilpsetu/col-accessories.svg');
const bannerPottery = require('@/assets/images/shilpsetu/banner-pottery.svg');

const IMAGE_MAP = {
  woodcrafts: colWoodcrafts,
  handlooms: colHandlooms,
  accessories: colAccessories,
  pottery: bannerPottery,
};

export default function OrderCard({ order, onPress, onRatePress }) {
  const norm = String(order?.status || order?.order_status || 'pending').toLowerCase();
  const isDelivered = norm.includes('delivered');
  const items = order?.order_items || [];
  const firstItem = items[0] || {};
  const itemCount = items.length;

  const dateStr = order?.created_at
    ? new Date(order.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '28 Oct 2026, 10:24 AM';

  const imageUrl = firstItem.image_url || firstItem.product?.image_url;
  const imageKey = firstItem.imageKey || firstItem.product?.imageKey || 'pottery';
  const imageSource = imageUrl ? { uri: imageUrl } : (IMAGE_MAP[imageKey] || bannerPottery);

  return (
    <View style={styles.card}>
      {/* 1. Header: Package Icon + Order Number + Date + Status Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.boxIcon}>📦</Text>
          <View>
            <Text style={styles.orderNumber}>Order #{order.order_number || 'SS10456'}</Text>
            <Text style={styles.orderDate}>{dateStr}</Text>
          </View>
        </View>
        <OrderStatusBadge status={order.status || order.order_status} />
      </View>

      {/* 2. Product Row with right arrow */}
      <TouchableOpacity
        style={styles.productRow}
        onPress={() => onPress && onPress(order)}
        activeOpacity={0.7}
      >
        <Image source={imageSource} style={styles.productImage} contentFit="cover" />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {firstItem.product_name || firstItem.product?.name || 'Handcrafted Pottery'}
          </Text>
          <Text style={styles.productQty}>
            Qty: {firstItem.quantity || 1}
            {itemCount > 1 ? ` (+${itemCount - 1} more items)` : ''}
          </Text>
          <Text style={styles.productPrice}>
            ₹{order.total_amount || firstItem.unit_price || 799}
          </Text>
        </View>

        <Text style={styles.rightArrow}>›</Text>
      </TouchableOpacity>

      {/* 3. Tracking Timeline */}
      <OrderTrackingTimeline order={order} />

      {/* 4. Delivered Action: Rate & Review */}
      {isDelivered && (
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() => onRatePress && onRatePress(firstItem, order.id)}
          activeOpacity={0.75}
        >
          <Text style={styles.rateStarIcon}>☆</Text>
          <Text style={styles.rateButtonText}>Rate & Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E4D4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boxIcon: {
    fontSize: 20,
    color: '#A85E2B',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
  },
  orderDate: {
    fontSize: 11,
    color: '#8A8275',
    marginTop: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F0E4D4',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 2,
  },
  productQty: {
    fontSize: 12,
    color: '#8A8275',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263C29',
  },
  rightArrow: {
    fontSize: 22,
    color: '#8A8275',
    paddingLeft: 8,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0E4D4',
    paddingTop: 10,
    marginTop: 8,
  },
  rateStarIcon: {
    fontSize: 16,
    color: '#A85E2B',
  },
  rateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A85E2B',
  },
});

