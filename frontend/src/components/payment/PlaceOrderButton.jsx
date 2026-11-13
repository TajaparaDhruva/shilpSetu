import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const BRAND = {
  primary: '#263C29',
};

export default function PlaceOrderButton({ onPress, loading = false, disabled = false, totalAmount }) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.content}>
          <Text style={styles.shield}>🛡</Text>
          <Text style={styles.label}>Place Order</Text>
          {totalAmount !== undefined && totalAmount !== null && (
            <Text style={styles.amount}>  ₹{Number(totalAmount).toFixed(2)}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shield: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
