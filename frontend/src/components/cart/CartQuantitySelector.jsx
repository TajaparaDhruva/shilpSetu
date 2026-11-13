import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * CartQuantitySelector — compact inline pill stepper for cart items.
 * Props:
 *   quantity  {number}   current qty
 *   stock     {number}   max stock
 *   onIncrease {func}
 *   onDecrease {func}
 */
export default function CartQuantitySelector({
  quantity = 1,
  stock = 99,
  onIncrease,
  onDecrease,
}) {
  const canDecrease = quantity > 1;
  const canIncrease = quantity < stock;

  return (
    <View style={styles.pill}>
      {/* Decrease */}
      <TouchableOpacity
        style={[styles.btn, !canDecrease && styles.btnDisabled]}
        onPress={onDecrease}
        disabled={!canDecrease}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
      >
        <Text style={[styles.btnText, !canDecrease && styles.btnTextDisabled]}>−</Text>
      </TouchableOpacity>

      {/* Quantity display */}
      <View style={styles.qtyBox}>
        <Text style={styles.qtyText}>{quantity}</Text>
      </View>

      {/* Increase */}
      <TouchableOpacity
        style={[styles.btn, !canIncrease && styles.btnDisabled]}
        onPress={onIncrease}
        disabled={!canIncrease}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
      >
        <Text style={[styles.btnText, !canIncrease && styles.btnTextDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    backgroundColor: '#FBF5EB',
    overflow: 'hidden',
  },
  btn: {
    width: 32,
    height: 32,
    backgroundColor: '#263C29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: '#8A8275',
    opacity: 0.5,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  btnTextDisabled: {
    color: '#CCCCCC',
  },
  qtyBox: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
  },
});
