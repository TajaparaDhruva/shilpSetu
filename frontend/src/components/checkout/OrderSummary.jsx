import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * OrderSummary — matches design reference with title "Order Summary"
 */
export default function OrderSummary({
  itemTotal = 0,
  productDiscount = 0,
  couponDiscount = 0,
  deliveryCharge = 0,
  totalAmount = 0,
  itemCount = 0,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.titleIcon}>🛍</Text>
        <Text style={styles.title}>Order Summary</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          Item Total {itemCount > 0 ? `(${itemCount} Items)` : ''}
        </Text>
        <Text style={styles.value}>₹{Math.round(itemTotal).toLocaleString('en-IN')}</Text>
      </View>

      {productDiscount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Discount</Text>
          <Text style={[styles.value, styles.discountTerracotta]}>
            −₹{Math.round(productDiscount).toLocaleString('en-IN')}
          </Text>
        </View>
      )}

      {couponDiscount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Coupon Discount</Text>
          <Text style={[styles.value, styles.discountGreen]}>
            −₹{Math.round(couponDiscount).toLocaleString('en-IN')}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Delivery Charges</Text>
        <Text style={styles.value}>
          {deliveryCharge === 0 ? 'FREE' : `₹${Math.round(deliveryCharge).toLocaleString('en-IN')}`}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          ₹{Math.round(totalAmount).toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F0E3',
    paddingVertical: 8,
    marginVertical: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  titleIcon: {
    fontSize: 18,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    color: '#6B6459',
  },
  value: {
    fontSize: 14,
    color: '#25251F',
    fontWeight: '600',
  },
  discountTerracotta: {
    color: '#A85E2B',
  },
  discountGreen: {
    color: '#287A3D',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5D7C5',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#25251F',
  },
  totalValue: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 20,
    fontWeight: '800',
    color: '#A85E2B',
  },
});

