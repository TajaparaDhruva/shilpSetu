import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const BRAND = {
  bg: '#F8F0E3',
  primary: '#263C29',
  secondary: '#A85E2B',
  text: '#25251F',
  card: '#FBF5EB',
  border: '#E5D7C5',
};

const PAYMENT_LABELS = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net Banking',
  cod: 'Cash on Delivery',
};

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const orderId = params.orderId || '';
  const orderNumber = params.orderNumber || '';
  const totalAmount = params.totalAmount ? Number(params.totalAmount) : 0;
  const paymentMethod = params.paymentMethod || '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Success illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.successCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <View style={styles.successRing} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Order Placed{'\n'}Successfully!</Text>

        {/* Order details card */}
        <View style={styles.detailCard}>
          {orderNumber ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order Number</Text>
              <Text style={styles.detailValue}>#{orderNumber}</Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          {paymentMethod ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Via</Text>
                <Text style={styles.detailValue}>{PAYMENT_LABELS[paymentMethod] || paymentMethod}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Info message */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🎨 Our artisans are crafting your order with love. You'll receive updates soon!
          </Text>
        </View>

        {/* Action buttons */}
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => router.push('/(customer)/home')}
          activeOpacity={0.8}
        >
          <Text style={styles.trackBtnText}>📦  Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => router.replace('/(customer)/home')}
          activeOpacity={0.8}
        >
          <Text style={styles.shopBtnText}>🛍  Continue Shopping</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  illustrationWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 2,
  },
  checkmark: {
    fontSize: 46,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 54,
  },
  successRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: BRAND.primary,
    opacity: 0.25,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.primary,
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 28,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 20,
    width: '100%',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: BRAND.text,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    color: BRAND.primary,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: BRAND.border,
    marginVertical: 4,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  infoText: {
    fontSize: 13,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 19,
  },
  trackBtn: {
    width: '100%',
    borderWidth: 2,
    borderColor: BRAND.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  trackBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.primary,
  },
  shopBtn: {
    width: '100%',
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shopBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
