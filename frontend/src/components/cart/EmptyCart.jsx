import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';

const iconCart = require('@/assets/images/shilpsetu/icon-cart.svg');

export default function EmptyCart({ onShopPress }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Image source={iconCart} style={styles.cartIcon} contentFit="contain" />
      </View>
      <Text style={styles.title}>Your cart is empty</Text>
      <Text style={styles.subtitle}>
        Looks like you haven't added anything yet.{'\n'}
        Explore authentic handmade creations from master artisans!
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0E4D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cartIcon: {
    width: 38,
    height: 38,
    tintColor: '#263C29',
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
