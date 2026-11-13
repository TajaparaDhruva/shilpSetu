import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function OrderPriceSummary({
  subtotal = 0,
  discount = 0,
  couponDiscount = 0,
  deliveryCharge = 0,
  total = 0,
  itemCount = 0,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Price Details</Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          Item Total {itemCount > 0 ? `(${itemCount} ${itemCount === 1 ? 'Item' : 'Items'})` : ''}
        </Text>
        <Text style={styles.value}>₹{Number(subtotal).toLocaleString('en-IN')}</Text>
      </View>

      {discount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Discount</Text>
          <Text style={styles.discountValue}>-₹{Number(discount).toLocaleString('en-IN')}</Text>
        </View>
      )}

      {couponDiscount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Coupon Discount</Text>
          <Text style={styles.discountValue}>-₹{Number(couponDiscount).toLocaleString('en-IN')}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Delivery Charges</Text>
        <Text style={styles.value}>
          {Number(deliveryCharge) === 0 ? 'FREE' : `₹${Number(deliveryCharge).toLocaleString('en-IN')}`}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>₹{Number(total).toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6E6B65',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: ShilpColors.primaryText || '#25251F',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#287A3D',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5D7C5',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: ShilpColors.primary || '#263C29',
  },
});

