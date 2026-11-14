import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProductFormInput from './ProductFormInput';

export default function ProductPriceStockInput({
  price,
  onChangePrice,
  stock,
  onChangeStock,
  priceError,
  stockError,
}) {
  return (
    <View style={styles.row}>
      <View style={styles.col}>
        <ProductFormInput
          label="Price (₹)"
          required
          value={price}
          onChangeText={onChangePrice}
          placeholder="e.g., 799"
          keyboardType="numeric"
          error={priceError}
        />
      </View>
      <View style={styles.spacer} />
      <View style={styles.col}>
        <ProductFormInput
          label="Stock"
          required
          value={stock}
          onChangeText={onChangeStock}
          placeholder="e.g., 10"
          keyboardType="numeric"
          error={stockError}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  spacer: {
    width: 14,
  },
});

