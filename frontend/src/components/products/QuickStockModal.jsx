import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Package, Minus, Plus } from 'lucide-react-native';

export default function QuickStockModal({
  visible,
  product,
  onClose,
  onUpdateStock,
}) {
  if (!product) return null;

  const currentStock = Number(product.stock !== undefined ? product.stock : product.stock_quantity || 0);
  const [stockVal, setStockVal] = useState(String(currentStock));

  // Sync on open
  React.useEffect(() => {
    if (visible && product) {
      const s = Number(product.stock !== undefined ? product.stock : product.stock_quantity || 0);
      setStockVal(String(s));
    }
  }, [visible, product]);

  const handleIncrement = () => {
    const val = parseInt(stockVal, 10) || 0;
    setStockVal(String(val + 1));
  };

  const handleDecrement = () => {
    const val = parseInt(stockVal, 10) || 0;
    if (val > 0) setStockVal(String(val - 1));
  };

  const handleSave = () => {
    const parsed = parseInt(stockVal, 10);
    if (isNaN(parsed) || parsed < 0) {
      alert('Stock cannot be negative.');
      return;
    }
    onUpdateStock(product.id, parsed);
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
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrap}
          >
            <TouchableWithoutFeedback>
              <View style={styles.dialog}>
                <View style={styles.header}>
                  <View style={styles.iconCircle}>
                    <Package size={22} color="#173D2B" strokeWidth={2} />
                  </View>
                  <View style={styles.titleCol}>
                    <Text style={styles.dialogTitle}>Update Inventory</Text>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name || product.product_name}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sublabel}>Enter available stock units:</Text>

                {/* Stock Counter Controls */}
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={handleDecrement}
                    activeOpacity={0.7}
                  >
                    <Minus size={18} color="#173D2B" strokeWidth={2.5} />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.stockInput}
                    value={stockVal}
                    onChangeText={setStockVal}
                    keyboardType="number-pad"
                    maxLength={5}
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={handleIncrement}
                    activeOpacity={0.7}
                  >
                    <Plus size={18} color="#173D2B" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Status Guide */}
                <View style={styles.statusGuide}>
                  <Text style={styles.guideText}>
                    {parseInt(stockVal, 10) <= 0
                      ? '🔴 Marked as Out of Stock'
                      : parseInt(stockVal, 10) <= 5
                      ? '🟡 Marked as Low Stock (≤ 5 units)'
                      : '🟢 Marked as In Stock'}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveText}>Save Stock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 30, 24, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 360,
  },
  dialog: {
    backgroundColor: '#FBF5EB',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EFE5D8',
    shadowColor: '#173D2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBE2D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleCol: {
    flex: 1,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173D2B',
  },
  productName: {
    fontSize: 13,
    color: '#7C7365',
    fontWeight: '500',
    marginTop: 1,
  },
  sublabel: {
    fontSize: 13,
    color: '#4A453E',
    fontWeight: '600',
    marginBottom: 12,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 14,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAE1D3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFD4C4',
  },
  stockInput: {
    width: 100,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4C5B0',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#173D2B',
  },
  statusGuide: {
    backgroundColor: '#F2E9DC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 18,
    alignItems: 'center',
  },
  guideText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A453E',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EFE5D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C5449',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#173D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8F0E3',
  },
});

