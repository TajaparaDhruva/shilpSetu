import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Calendar, DollarSign, CreditCard } from 'lucide-react-native';

const PAYMENT_STATUS_OPTIONS = [
  { id: 'all', label: 'All Payments' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending Payment' },
  { id: 'failed', label: 'Failed' },
];

const ORDER_STATUS_OPTIONS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function OrderFilterModal({
  visible,
  onClose,
  initialFilters = {},
  onApplyFilters,
}) {
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status || 'all');
  const [selectedPayment, setSelectedPayment] = useState(initialFilters.paymentStatus || 'all');
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice ? String(initialFilters.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice ? String(initialFilters.maxPrice) : '');

  const handleApply = () => {
    onApplyFilters({
      status: selectedStatus,
      paymentStatus: selectedPayment,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedStatus('all');
    setSelectedPayment('all');
    setMinPrice('');
    setMaxPrice('');
    onApplyFilters({
      status: 'all',
      paymentStatus: 'all',
      minPrice: null,
      maxPrice: null,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Filter Orders</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#5C5346" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {/* 1. Order Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Status</Text>
                  <View style={styles.optionsWrap}>
                    {ORDER_STATUS_OPTIONS.map((opt) => {
                      const isSel = selectedStatus === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.chip, isSel && styles.chipSelected]}
                          onPress={() => setSelectedStatus(opt.id)}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Payment Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Status</Text>
                  <View style={styles.optionsWrap}>
                    {PAYMENT_STATUS_OPTIONS.map((opt) => {
                      const isSel = selectedPayment === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.chip, isSel && styles.chipSelected]}
                          onPress={() => setSelectedPayment(opt.id)}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Price Range */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Price Range (₹)</Text>
                  <View style={styles.priceRow}>
                    <View style={styles.priceInputWrap}>
                      <Text style={styles.inputPrefix}>₹</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Min"
                        placeholderTextColor="#A89F93"
                        keyboardType="numeric"
                        value={minPrice}
                        onChangeText={setMinPrice}
                      />
                    </View>
                    <Text style={styles.priceSeparator}>to</Text>
                    <View style={styles.priceInputWrap}>
                      <Text style={styles.inputPrefix}>₹</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Max"
                        placeholderTextColor="#A89F93"
                        keyboardType="numeric"
                        value={maxPrice}
                        onChangeText={setMaxPrice}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                  <Text style={styles.resetBtnText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 61, 43, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DC',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#173D2B',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 10,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F5EFE6',
    borderWidth: 1,
    borderColor: '#E7DDD0',
  },
  chipSelected: {
    backgroundColor: '#173D2B',
    borderColor: '#173D2B',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4237',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5EE',
    borderWidth: 1,
    borderColor: '#E5DCD0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  inputPrefix: {
    fontSize: 14,
    color: '#8A7F73',
    fontWeight: '600',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C2E24',
    padding: 0,
  },
  priceSeparator: {
    fontSize: 13,
    color: '#8A7F73',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DC',
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F6F1EA',
    borderWidth: 1,
    borderColor: '#E2D7C8',
  },
  resetBtnText: {
    color: '#655A4E',
    fontWeight: '700',
    fontSize: 14,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#173D2B',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
