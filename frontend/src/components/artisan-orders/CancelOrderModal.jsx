import React, { useState } from 'react';
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
import { X, AlertTriangle } from 'lucide-react-native';

const REASON_PRESETS = [
  'Raw material shortage / Out of stock',
  'Craft production delay',
  'Unable to deliver to customer location',
  'Buyer requested cancellation',
];

export default function CancelOrderModal({
  visible,
  onClose,
  order,
  onSubmit,
}) {
  const [selectedPreset, setSelectedPreset] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const finalReason = customReason.trim() || selectedPreset;

  const handleConfirmCancel = async () => {
    if (!finalReason) {
      Alert.alert('Required', 'Please select or provide a cancellation reason.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        orderId: order?.id,
        reason: finalReason,
      });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to cancel order.');
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
                <View style={styles.iconWarningWrap}>
                  <AlertTriangle size={20} color="#B82D24" />
                </View>
                <Text style={styles.title}>Cancel Order</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#5C5346" />
                </TouchableOpacity>
              </View>

              <Text style={styles.description}>
                Are you sure you want to cancel order {order?.order_number || `#${String(order?.id || '').slice(0, 6)}`}? This will notify the buyer and restore product inventory.
              </Text>

              <Text style={styles.sectionLabel}>Reason for Cancellation <Text style={styles.required}>*</Text></Text>

              <View style={styles.presets}>
                {REASON_PRESETS.map((p) => {
                  const isSel = selectedPreset === p && !customReason.trim();
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.presetChip, isSel && styles.presetChipSelected]}
                      onPress={() => {
                        setSelectedPreset(p);
                        setCustomReason('');
                      }}
                    >
                      <Text style={[styles.presetText, isSel && styles.presetTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.customInput}
                placeholder="Or specify another reason..."
                placeholderTextColor="#A89F93"
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
              />

              {/* Actions */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.keepBtn}
                  onPress={onClose}
                  disabled={submitting}
                >
                  <Text style={styles.keepBtnText}>Keep Order</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleConfirmCancel}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.cancelBtnText}>Confirm Cancel</Text>
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
    marginBottom: 10,
    gap: 8,
  },
  iconWarningWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDEEEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#B82D24',
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 13,
    color: '#6F665B',
    lineHeight: 18,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#28231C',
    marginBottom: 8,
  },
  required: {
    color: '#B82D24',
  },
  presets: {
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8F3EC',
    borderWidth: 1,
    borderColor: '#E6DCCF',
  },
  presetChipSelected: {
    backgroundColor: '#FDEEEB',
    borderColor: '#F6C3BC',
  },
  presetText: {
    fontSize: 12,
    color: '#4E453A',
    fontWeight: '500',
  },
  presetTextSelected: {
    color: '#B82D24',
    fontWeight: '700',
  },
  customInput: {
    backgroundColor: '#F9F5EE',
    borderWidth: 1,
    borderColor: '#E2D8C9',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#1C2E24',
    textAlignVertical: 'top',
    height: 60,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  keepBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F7F2EC',
    borderWidth: 1,
    borderColor: '#E2D8C9',
  },
  keepBtnText: {
    color: '#655A4E',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#B82D24',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
