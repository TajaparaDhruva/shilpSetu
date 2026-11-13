import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export default function EmptyCart({ onShopPress }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🛍️</Text>
      <Text style={styles.title}>Your cart is empty</Text>
      <Text style={styles.subtitle}>
        Looks like you haven't added anything yet.{'\n'}
        Explore our handcrafted collection!
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onShopPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Continue Shopping"
      >
        <Text style={styles.buttonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    backgroundColor: '#F8F0E3',
  },
  icon: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 22,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6459',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#263C29',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
