import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

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

export default function ArtisanRecentOrderCard({ order, onPress }) {
  const {
    orderNumber = 'SS00000',
    productName = 'Handcrafted Item',
    price = 0,
    quantity = 1,
    status = 'new',
    statusLabel = 'New',
    imageKey = 'pottery',
    imageUrl = null,
  } = order || {};

  const isNew = status.toLowerCase() === 'new' || status.toLowerCase() === 'ordered';
  const isPacked = status.toLowerCase() === 'packed' || status.toLowerCase() === 'processing';

  const badgeBg = isNew ? '#DCE8B5' : isPacked ? '#E0E5EF' : '#F0E4D4';
  const badgeColor = isNew ? '#287A3D' : isPacked ? '#3D5A80' : '#8A5B2D';

  const imageSource = imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')
    ? { uri: imageUrl }
    : IMAGE_MAP[imageKey?.toLowerCase()] || bannerPottery;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onPress && onPress(order)}
      accessibilityRole="button"
      accessibilityLabel={`Order ${orderNumber}, ${productName}`}
    >
      {/* Product Image */}
      <Image source={imageSource} style={styles.image} contentFit="cover" />

      {/* Order Info */}
      <View style={styles.info}>
        <Text style={styles.orderNumber}>#{orderNumber}</Text>
        <Text style={styles.productName} numberOfLines={1}>
          {productName}
        </Text>
        <Text style={styles.meta}>
          ₹{Number(price).toLocaleString('en-IN')}  •  Qty: {quantity}
        </Text>
      </View>

      {/* Status Badge + Arrow */}
      <View style={styles.rightGroup}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F0E4D4',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    letterSpacing: -0.2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: ShilpColors.primaryText || '#25251F',
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: '#6E6B65',
    marginTop: 3,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#A89F91',
    marginLeft: 2,
  },
});

