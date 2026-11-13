import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

import ExploreHeader from '@/components/explore/ExploreHeader';
import CheckoutProgress from './CheckoutProgress';
import AddressCard from './AddressCard';
import AddressForm from './AddressForm';
import DeliveryOptionCard from './DeliveryOptionCard';
import OrderSummary from './OrderSummary';

import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/services/addressService';
import {
  getDeliveryOptions,
  calculatePriceSummary,
  validateCartForCheckout,
} from '@/services/checkoutService';
import { getCart, getCartCount } from '@/services/cartService';
import { getAppliedCoupon } from '@/services/couponService';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('standard');
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [priceSummary, setPriceSummary] = useState({
    itemTotal: 0,
    productDiscount: 0,
    couponDiscount: 0,
    deliveryCharge: 49,
    totalAmount: 0,
  });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [addrList, delOptions, items] = await Promise.all([
        getAddresses(),
        Promise.resolve(getDeliveryOptions()),
        getCart(),
      ]);

      const coupon = getAppliedCoupon();
      setAppliedCoupon(coupon);

      setAddresses(addrList || []);
      const defaultAddr = addrList?.find((a) => a.is_default) || addrList?.[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }

      setDeliveryOptions(delOptions || []);
      setCartItems(items || []);

      const chosenOption = delOptions?.find((d) => d.id === selectedDeliveryId) || delOptions?.[0];
      const deliveryFee = chosenOption ? chosenOption.charge : 49;
      const couponDisc = coupon?.discount_amount || 0;

      const summary = calculatePriceSummary(items || [], deliveryFee, couponDisc);
      setPriceSummary(summary);
    } catch {
      Alert.alert('Error', 'Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  }, [selectedDeliveryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate summary on delivery change
  const handleSelectDelivery = (optionId) => {
    setSelectedDeliveryId(optionId);
    const chosenOption = deliveryOptions.find((d) => d.id === optionId);
    const deliveryFee = chosenOption ? chosenOption.charge : 49;
    const couponDisc = appliedCoupon?.discount_amount || 0;
    const summary = calculatePriceSummary(cartItems, deliveryFee, couponDisc);
    setPriceSummary(summary);
  };

  const handleSaveAddress = async (formData) => {
    try {
      if (editingAddress?.id) {
        await updateAddress(editingAddress.id, formData);
      } else {
        const newAddr = await addAddress(formData);
        if (newAddr?.id) {
          setSelectedAddressId(newAddr.id);
        }
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      const refreshed = await getAddresses();
      setAddresses(refreshed || []);
    } catch (err) {
      Alert.alert('Address Error', err.message || 'Could not save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAddress(id);
          const refreshed = await getAddresses();
          setAddresses(refreshed || []);
          if (selectedAddressId === id) {
            setSelectedAddressId(refreshed?.[0]?.id || null);
          }
        },
      },
    ]);
  };

  const handleContinueToPayment = async () => {
    if (!selectedAddressId) {
      Alert.alert('Select Address', 'Please select or add a delivery address to continue.');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items to checkout.');
      return;
    }

    // Validate stock
    const validation = await validateCartForCheckout(cartItems);
    if (!validation.valid) {
      Alert.alert('Stock Issue', validation.message || 'Some items are unavailable.');
      return;
    }

    const chosenOption = deliveryOptions.find((d) => d.id === selectedDeliveryId);

    router.push({
      pathname: '/(customer)/checkout/payment',
      params: {
        addressId: selectedAddressId,
        deliveryOption: selectedDeliveryId,
        deliveryFee: chosenOption?.charge || 49,
        cartSummary: JSON.stringify(priceSummary),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#F8F0E3" />
        <ExploreHeader cartCount={getCartCount()} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#263C29" />
          <Text style={styles.loadingText}>Preparing checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F8F0E3" />

      {/* Header */}
      <ExploreHeader
        cartCount={getCartCount()}
        onCartPress={() => router.push('/(customer)/cart')}
        onNotificationPress={() => Alert.alert('Notifications', 'No new notifications.')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.pageTitle}>Checkout</Text>

        {/* 4-Stage Progress Indicator */}
        <CheckoutProgress currentStep={2} />

        {/* Delivery Address Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingAddress(null);
              setShowAddressForm(true);
            }}
          >
            <Text style={styles.addAddressText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {addresses.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyAddressCard}
            onPress={() => {
              setEditingAddress(null);
              setShowAddressForm(true);
            }}
          >
            <Text style={styles.emptyAddressIcon}>📍</Text>
            <Text style={styles.emptyAddressTitle}>No Saved Addresses</Text>
            <Text style={styles.emptyAddressSubtitle}>Tap here to add a delivery address</Text>
          </TouchableOpacity>
        ) : (
          addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              isSelected={addr.id === selectedAddressId}
              isDefault={addr.is_default}
              onSelect={() => setSelectedAddressId(addr.id)}
              onEdit={() => {
                setEditingAddress(addr);
                setShowAddressForm(true);
              }}
              onDelete={() => handleDeleteAddress(addr.id)}
            />
          ))
        )}

        {/* Delivery Options Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>🚚</Text>
            <Text style={styles.sectionTitle}>Delivery Options</Text>
          </View>
        </View>

        {deliveryOptions.map((opt) => (
          <DeliveryOptionCard
            key={opt.id}
            option={opt}
            isSelected={opt.id === selectedDeliveryId}
            onSelect={() => handleSelectDelivery(opt.id)}
          />
        ))}

        {/* Order Summary */}
        <OrderSummary
          itemTotal={priceSummary.itemTotal}
          productDiscount={priceSummary.productDiscount}
          couponDiscount={priceSummary.couponDiscount}
          deliveryCharge={priceSummary.deliveryCharge}
          totalAmount={priceSummary.totalAmount}
          itemCount={cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)}
        />

        {/* Continue to Payment Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueToPayment}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Continue to Payment →</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm
          address={editingAddress}
          onSave={handleSaveAddress}
          onCancel={() => {
            setShowAddressForm(false);
            setEditingAddress(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 26,
    fontWeight: '700',
    color: '#263C29',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 17,
    fontWeight: '700',
    color: '#263C29',
  },
  addAddressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A85E2B',
  },
  emptyAddressCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  emptyAddressIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyAddressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263C29',
  },
  emptyAddressSubtitle: {
    fontSize: 12,
    color: '#8A8275',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#263C29',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#263C29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 30,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8A8275',
  },
});

