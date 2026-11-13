import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * PriceSummary — price breakdown section.
 * Props:
 *   itemTotal        {number}
 *   productDiscount  {number}
 *   couponDiscount   {number}
 *   deliveryCharge   {number}
 *   totalAmount      {number}
 */
export default function PriceSummary({
  itemTotal = 0,
  productDiscount = 0,
  couponDiscount = 0,
  deliveryCharge = 0,
  totalAmount = 0,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Price Details</Text>

      {/* Item Total */}
      <View style={styles.row}>
        <Text style={styles.label}>Item Total</Text>
        <Text style={styles.value}>₹{itemTotal.toFixed(2)}</Text>
      </View>

      {/* Product Discount */}
      {productDiscount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Product Discount</Text>
          <Text style={[styles.value, styles.discountTerracotta]}>
            −₹{productDiscount.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Coupon Discount */}
      {couponDiscount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Coupon Discount</Text>
          <Text style={[styles.value, styles.discountGreen]}>
            −₹{couponDiscount.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Delivery Charges */}
      <View style={styles.row}>
        <Text style={styles.label}>Delivery Charges</Text>
        {deliveryCharge === 0 ? (
          <Text style={[styles.value, styles.discountGreen]}>FREE</Text>
        ) : (
          <Text style={styles.value}>₹{deliveryCharge.toFixed(2)}</Text>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Total Amount */}
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={[styles.totalValue, styles.discountTerracotta]}>
          ₹{totalAmount.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FBF5EB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 16,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#5A5A52',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#25251F',
    fontWeight: '600',
  },
  discountTerracotta: {
    color: '#A85E2B',
    fontWeight: '700',
  },
  discountGreen: {
    color: '#2A7A2E',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5D7C5',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#25251F',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
