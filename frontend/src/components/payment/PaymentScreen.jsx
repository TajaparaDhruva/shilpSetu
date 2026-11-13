import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import ExploreHeader from '@/components/explore/ExploreHeader';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import PaymentMethodCard from '@/components/payment/PaymentMethodCard';
import PlaceOrderButton from '@/components/payment/PlaceOrderButton';
import PriceSummary from '@/components/cart/PriceSummary';

import { getPaymentMethods, initiateCODOrder, initiatOnlinePayment } from '@/services/paymentService';
import { placeOrder } from '@/services/orderService';
import { validateCartForCheckout } from '@/services/checkoutService';
import { getCart } from '@/services/cartService';

const BRAND = {
  bg: '#F8F0E3',
  primary: '#263C29',
  secondary: '#A85E2B',
  text: '#25251F',
  card: '#FBF5EB',
  border: '#E5D7C5',
};

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const addressId = params.addressId;
  const deliveryOption = params.deliveryOption || 'standard';
  let cartSummary = null;
  try {
    cartSummary = params.cartSummary ? JSON.parse(params.cartSummary) : null;
  } catch (_) {}

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [placingError, setPlacingError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [methods, cart] = await Promise.all([
          getPaymentMethods(),
          getCart(),
        ]);
        setPaymentMethods(methods || []);
        setCartItems(Array.isArray(cart) ? cart : []);
      } catch (err) {
        console.error('PaymentScreen init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const totalAmount = cartSummary?.totalAmount ?? 0;

  const handlePlaceOrder = useCallback(async () => {
    if (placing) return;

    // 1. Validate payment method selected
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose a payment method to continue.');
      return;
    }

    // 2. Validate cart
    const validation = validateCartForCheckout(cartItems);
    if (!validation.valid) {
      Alert.alert(
        'Cart Issue',
        validation.errors?.join('\n') || 'Some items in your cart are unavailable.',
      );
      return;
    }

    setPlacing(true);
    setPlacingError(null);

    try {
      const orderData = {
        addressId,
        deliveryOption,
        paymentMethod: selectedMethod,
        cartItems,
        totalAmount,
        ...(cartSummary || {}),
      };

      let result;

      if (selectedMethod === 'cod') {
        // 3. COD flow
        result = await initiateCODOrder(orderData);
      } else {
        // 4. Online payment flow
        result = await initiatOnlinePayment(selectedMethod, orderData);
        if (result?.success) {
          Alert.alert(
            'Payment Gateway',
            'Redirecting to payment gateway... (Demo mode: order placed directly)',
          );
        }
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Order placement failed. Please try again.');
      }

      // 5. Navigate to success screen
      router.replace({
        pathname: '/(customer)/checkout/success',
        params: {
          orderId: result.orderId || '',
          orderNumber: result.orderNumber || '',
          totalAmount: String(totalAmount),
          paymentMethod: selectedMethod,
        },
      });
    } catch (err) {
      const msg = err?.message || 'Something went wrong placing your order.';
      setPlacingError(msg);
      Alert.alert('Order Failed', msg);
    } finally {
      setPlacing(false);
    }
  }, [placing, selectedMethod, cartItems, addressId, deliveryOption, totalAmount, cartSummary, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingText}>Loading payment options…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExploreHeader title="Payment" showBack />
      <CheckoutProgress currentStep={3} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              isSelected={selectedMethod === method.id}
              onSelect={setSelectedMethod}
              selectedUpiApp={selectedUpiApp}
              onSelectUpiApp={setSelectedUpiApp}
            />
          ))}
        </View>

        {/* Price Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <PriceSummary
            itemTotal={cartSummary?.itemTotal ?? 0}
            productDiscount={cartSummary?.productDiscount ?? 0}
            couponDiscount={cartSummary?.couponDiscount ?? 0}
            deliveryCharge={cartSummary?.deliveryCharge ?? 0}
            totalAmount={totalAmount}
          />
        </View>

        {placingError ? (
          <Text style={styles.errorText}>{placingError}</Text>
        ) : null}

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Place Order Button */}
      <View style={styles.footer}>
        <PlaceOrderButton
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={!selectedMethod}
          totalAmount={totalAmount}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: BRAND.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: BRAND.text,
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.text,
    fontFamily: 'serif',
    marginBottom: 12,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND.card,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
});
