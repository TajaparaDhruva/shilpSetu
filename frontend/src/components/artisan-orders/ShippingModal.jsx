import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Truck, Hash, Globe } from 'lucide-react-native';

export default function ShippingModal({
  visible,
  onClose,
  order,
  isEditing = false,
  onSubmit,
}) {
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setCourierName(order.courier_name || '');
      setTrackingNumber(order.tracking_number || '');
      setTrackingUrl(order.tracking_url || '');
    } else {
      setCourierName('');
      setTrackingNumber('');
      setTrackingUrl('');
    }
  }, [order, visible]);

  const handleSubmit = async () => {
    if (!courierName.trim()) {
      Alert.alert('Missing Field', 'Please enter the courier name (e.g. Blue Dart, Delhivery, DTDC).');
      return;
    }
    if (!trackingNumber.trim()) {
      Alert.alert('Missing Field', 'Please enter the shipment tracking number.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        orderId: order?.id,
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim(),
      });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update shipping information.');
    } finally {
      setSubmitting(false);
    }
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
                <View style={styles.headerTitleWrap}>
                  <Truck size={20} color="#173D2B" strokeWidth={2.2} />
                  <Text style={styles.title}>
                    {isEditing ? 'Update Tracking Details' : 'Dispatch & Ship Order'}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#5C5346" />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Enter the shipment details for order {order?.order_number || `#${String(order?.id || '').slice(0, 6)}`}.
              </Text>

              {/* Form Inputs */}
              <View style={styles.form}>
                {/* 1. Courier Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Courier Partner Name <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrap}>
                    <Truck size={16} color="#8A7E72" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Blue Dart, Delhivery, DTDC, India Post"
                      placeholderTextColor="#A89F93"
                      value={courierName}
                      onChangeText={setCourierName}
                    />
                  </View>
                </View>

                {/* 2. Tracking Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Tracking / AWB Number <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrap}>
                    <Hash size={16} color="#8A7E72" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. BD-89210492"
                      placeholderTextColor="#A89F93"
                      value={trackingNumber}
                      onChangeText={setTrackingNumber}
                    />
                  </View>
                </View>

                {/* 3. Tracking URL */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tracking URL (Optional)</Text>
                  <View style={styles.inputWrap}>
                    <Globe size={16} color="#8A7E72" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="https://..."
                      placeholderTextColor="#A89F93"
                      autoCapitalize="none"
                      keyboardType="url"
                      value={trackingUrl}
                      onChangeText={setTrackingUrl}
                    />
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      {isEditing ? 'Save Changes' : 'Confirm Shipment'}
                    </Text>
                  )}
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
    backgroundColor: 'rgba(23, 61, 43, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#173D2B',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6F665B',
    marginBottom: 16,
  },
  form: {
    gap: 14,
    marginBottom: 20,
  },
  inputGroup: {},
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A2621',
    marginBottom: 6,
  },
  required: {
    color: '#B82D24',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5EE',
    borderWidth: 1,
    borderColor: '#E2D8C9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1C2E24',
    padding: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F7F2EC',
    borderWidth: 1,
    borderColor: '#E2D8C9',
  },
  cancelBtnText: {
    color: '#655A4E',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#173D2B',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
