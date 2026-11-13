import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

export default function OrderProductInfo({
  items = [],
  onPressProduct,
  onRateReview,
  canReview = false,
}) {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Ordered Items ({items.reduce((s, i) => s + (i.quantity || 1), 0)})
      </Text>

      {items.map((item, index) => {
        const product = item.products || item.product || item;
        const productName = product?.title || product?.name || item.title || item.name || 'Handcrafted Art';
        const artisanName = product?.artisan_name || product?.artisan?.name || item.artisan_name || 'Master Artisan';
        const unitPrice = item.unit_price || item.price || product?.price || 0;
        const qty = item.quantity || 1;
        const imageSource = product?.image_url && typeof product.image_url === 'string' && product.image_url.startsWith('http')
          ? { uri: product.image_url }
          : IMAGE_MAP[product?.category?.toLowerCase()] || IMAGE_MAP.pottery;

        return (
          <View key={item.id || index} style={styles.itemCard}>
            <TouchableOpacity
              style={styles.itemRow}
              activeOpacity={0.8}
              onPress={() => onPressProduct && onPressProduct(product?.id || item.product_id)}
            >
              <Image source={imageSource} style={styles.image} contentFit="cover" />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{productName}</Text>
                <Text style={styles.artisan}>By {artisanName}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.qty}>Qty: {qty}</Text>
                  <Text style={styles.price}>₹{Number(unitPrice).toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {canReview && onRateReview && (
              <TouchableOpacity
                style={styles.reviewBtn}
                activeOpacity={0.7}
                onPress={() => onRateReview(item)}
              >
                <Text style={styles.reviewStar}>⭐</Text>
                <Text style={styles.reviewBtnText}>Rate & Review Product</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 12,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#F0E4D4',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 2,
  },
  artisan: {
    fontSize: 12,
    color: '#8A8478',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qty: {
    fontSize: 13,
    color: '#6E6B65',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFE3D5',
  },
  reviewStar: {
    fontSize: 14,
    marginRight: 6,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: ShilpColors.secondary || '#A85E2B',
  },
});

