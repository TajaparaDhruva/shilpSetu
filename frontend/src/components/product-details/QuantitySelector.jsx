import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function QuantitySelector({
  quantity = 1,
  stock = 10,
  onChangeQuantity,
}) {
  const isOutOfStock = stock <= 0;
  const canDecrease = quantity > 1 && !isOutOfStock;
  const canIncrease = quantity < stock && !isOutOfStock;

  const handleDecrease = () => {
    if (canDecrease && onChangeQuantity) {
      onChangeQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (canIncrease && onChangeQuantity) {
      onChangeQuantity(quantity + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Quantity</Text>
          {isOutOfStock ? (
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          ) : stock <= 5 ? (
            <Text style={styles.stockNotice}>Only {stock} left in stock</Text>
          ) : null}
        </View>

        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.stepButton, !canDecrease && styles.stepButtonDisabled]}
            onPress={handleDecrease}
            disabled={!canDecrease}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Text style={[styles.stepText, !canDecrease && styles.stepTextDisabled]}>
              —
            </Text>
          </TouchableOpacity>

          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityText}>{isOutOfStock ? 0 : quantity}</Text>
          </View>

          <TouchableOpacity
            style={[styles.stepButton, !canIncrease && styles.stepButtonDisabled]}
            onPress={handleIncrease}
            disabled={!canIncrease}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Text style={[styles.stepText, !canIncrease && styles.stepTextDisabled]}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263C29',
  },
  stockNotice: {
    fontSize: 11,
    color: '#A85E2B',
    fontWeight: '600',
    marginTop: 2,
  },
  outOfStockText: {
    fontSize: 12,
    color: '#D9534F',
    fontWeight: '700',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 3,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E4D4',
  },
  stepButtonDisabled: {
    backgroundColor: '#FBF5EB',
    opacity: 0.5,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263C29',
  },
  stepTextDisabled: {
    color: '#8A8275',
  },
  quantityDisplay: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25251F',
  },
});

