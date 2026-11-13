import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { applyCoupon, removeCoupon } from '@/services/couponService';

/**
 * CouponCard — coupon apply/remove UI for the cart.
 * Props:
 *   appliedCoupon   {object|null}  currently applied coupon state
 *   onApplyCoupon   {func}         (couponResult) called after successful apply
 *   onRemoveCoupon  {func}         called after removal
 */
export default function CouponCard({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openModal = () => {
    setCode('');
    setError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setError('');
  };

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a coupon code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await applyCoupon(trimmed, 0);
      if (result && result.valid) {
        onApplyCoupon && onApplyCoupon(result);
        closeModal();
      } else {
        setError(result?.error || 'Invalid coupon code.');
      }
    } catch (e) {
      setError('Could not apply coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    removeCoupon && removeCoupon();
    onRemoveCoupon && onRemoveCoupon();
    closeModal();
  };

  return (
    <>
      {/* Row display */}
      <TouchableOpacity
        style={styles.card}
        onPress={openModal}
        activeOpacity={0.8}
      >
        <View style={styles.left}>
          <Text style={styles.percentIcon}>%</Text>
          {appliedCoupon ? (
            <View>
              <Text style={styles.appliedCode}>{appliedCoupon.coupon?.code || 'COUPON'} Applied</Text>
              <Text style={styles.appliedSaving}>
                You save ₹{appliedCoupon.discountAmount ?? 0}
              </Text>
            </View>
          ) : (
            <Text style={styles.applyLabel}>Apply Coupon</Text>
          )}
        </View>
        <Text style={styles.arrow}>{appliedCoupon ? '✓' : '›'}</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Apply Coupon</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter coupon code"
                placeholderTextColor="#8A8275"
                value={code}
                onChangeText={(t) => { setCode(t); setError(''); }}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleApply}
              />
              <TouchableOpacity
                style={[styles.applyBtn, loading && styles.applyBtnDisabled]}
                onPress={handleApply}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.applyBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {appliedCoupon && (
              <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                <Text style={styles.removeBtnText}>Remove Applied Coupon</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBF5EB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percentIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#263C29',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  applyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#25251F',
  },
  appliedCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A7A2E',
  },
  appliedSaving: {
    fontSize: 12,
    color: '#2A7A2E',
    fontWeight: '500',
    marginTop: 1,
  },
  arrow: {
    fontSize: 20,
    color: '#263C29',
    fontWeight: '700',
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F8F0E3',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25251F',
  },
  closeBtn: {
    fontSize: 18,
    color: '#8A8275',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#25251F',
    fontWeight: '600',
    letterSpacing: 1,
  },
  applyBtn: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: '#263C29',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.65,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#D9534F',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 4,
  },
  removeBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9534F',
  },
  removeBtnText: {
    color: '#D9534F',
    fontSize: 14,
    fontWeight: '600',
  },
});
